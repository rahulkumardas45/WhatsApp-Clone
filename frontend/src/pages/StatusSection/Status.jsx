import React, { useEffect, useState } from 'react'
import useThemeStore from '../../store/themeStore.js';
import userUserStore from '../../store/useUserStore.js';
import useStatusStore from '../../store/useStatusStore.js';

import { Layout } from '../../component/Layout.jsx';
import StatusPreview from './StatusPreview.jsx';
import { motion } from 'framer-motion';
import { RxCross2 } from 'react-icons/rx';
import { FaCamera, FaCross, FaEllipsisH, FaPlus } from 'react-icons/fa';
import formatTimestamp from '../../utils/formatTime.js';
import StatusList from './StatusList.jsx';




export const Status = () => {
  const [previewContact, setPreviewContact] = useState(null);

  const [currentStatusIndex, setCurrentStatusIndex] = useState(0);

  const [showOption, setShowOption] = useState(false);
  const [selectdFile, setSelectedFile] = useState(null);
  const [showCreateModel, setShowCreateModel] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  const [filePreview, setFilePreview] = useState(null);


  const { theme } = useThemeStore();
  const { user } = userUserStore();


  //status store

  const {
    statuses,
    fetchStatuses,
    loading,
    error,
    createStatus,
    initializeSocket,
    viewStatus,
    deleteStatus,
    getStatusViewers,
    getGroupedStatus,
    getUserStatuses,
    getOtherStatuses,
    clearError,
    reset,
    cleanupSocket,
  } = useStatusStore();


  const userStatuses = getUserStatuses(user?._id);
  const otherStatuses = getOtherStatuses(user?._id) || [];

  useEffect(() => {
    fetchStatuses();
    initializeSocket();

    return () => {
      cleanupSocket();
      reset();
    }
  }, [user?._id])


  //clear the error
  useEffect(() => {
    return () => {
      clearError();
    }
  }, [error, clearError])


  // handle file selection

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);


      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        setFilePreview(URL.createObjectURL(file))
      }

    }
  }

  // create the new status

  const handleCreateStatus = async () => {
    if (!newStatus.trim() && !selectdFile) {
      return;
    }

    try {
      await createStatus({
        content: newStatus,
        file: selectdFile
      });

      setNewStatus("");
      setSelectedFile(null);
      setFilePreview(null);
      setShowCreateModel(false);
    } catch (error) {
      console.error("create status error", error);

    }

  }

  // handle view of the status

  const handleViewStatus = async (statusId) => {
    try {
      await viewStatus(statusId);
    } catch (error) {
      console.error("view status error", error);

    }
  }

  //handle delete

  const handleDeleteStatus = async (statusId) => {
    try {
      await deleteStatus(statusId);
      setShowOption(false)
      handlePreviewClose();
    } catch (error) {
      console.error("delete status error", error);

    }
  }

  //preview close

  const handlePreviewClose = () => {
    setPreviewContact(null);
    setCurrentStatusIndex(0);
  }

  // component render

  const handlePreviewNext = () => {
    if (currentStatusIndex < previewContact.statuses.length - 1) {
      setCurrentStatusIndex((prev) => prev + 1);
    } else {
      handlePreviewClose();
    }
  }


  const handlePreviewPrev = () => {
    if (currentStatusIndex > 0) {
      setCurrentStatusIndex((prev) => Math.max(prev - 1, 0));
    }
  }

  const handleStatusPreview = (contact, statusIndex = 0) => {
    setPreviewContact(contact);
    setCurrentStatusIndex(statusIndex);

    if (contact && contact.statuses && contact.statuses[statusIndex]) {
      handleViewStatus(contact.statuses[statusIndex]._id);

    }
  }




  return (
    <Layout
      isStatusPreviewOpen={!!previewContact}
      statusPreviewContent={
        previewContact && (
          <StatusPreview
            contact={previewContact}
            currentIndex={currentStatusIndex}
            onClose={handlePreviewClose}
            onNext={handlePreviewNext}
            onPrev={handlePreviewPrev}
            onDelete={handleDeleteStatus}
            theme={theme}
            currentUser={user}
          />
        )
      }
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}

        className={`flex-1 h-screen border-r ${theme === 'dark' ? "bg-[rgb(12,19,24)] text-white border-gray-600" : "bg-gray-100 text-black"} `}
      >

        <div className={`flex justify-between items-center shadow-md ${theme === 'dark' ? "bg-[rgb(17,27,33)] " : "bg-white"} p-4 `}>
          <h2 className='text-2xl font-bold'>Status</h2>
        </div>

        {
          error && (<div className='bg-red-200 border border-red-400 text-red-700 px-4 py-3 rounded mx-4 mt-2'>
            <span className='block sm:inline'>{error}</span>
            <button onClick={clearError} className='float-right text-red-500 hover:text-red-700'>
              <RxCross2 className='h-5 w-5' />
            </button>
          </div>)
        }


        <div className="overflow-y-auto h-[calc(100vh-64px)]">
          <div
            className={`flex space-x-4 shadow-md ${theme === 'dark' ? "bg-[rgb(17,27,33)]" : "bg-white"} p-4`}
          >
            <div className='relative cursor-pointer'
              onClick={() =>
                userStatuses ? handleStatusPreview(userStatuses) : setShowCreateModel(true)
              }
            >
              <img
                src={user?.profilepicture}
                alt={user?.username}

                className='w-12 h-12 rounded-full object-cover'

              />

              {
                userStatuses ? (
                  <>
                    <svg
                      className='absolute top-0 left-0 w-12 h-12'
                      viewBox='0 0 100 100'
                    >
                      {
                        userStatuses.statuses.map((_, index) => {
                          const radius = 48;
                          const circumference = 2 * Math.PI * radius;
                          const segmentLength = circumference / userStatuses.statuses.length;
                          const gap = 4; // space between segments
                          const dashLength = segmentLength - gap;
                          const offset = index * segmentLength;

                          return (
                            <circle
                              key={index}
                              r={radius}
                              cx="50"
                              cy="50"
                              fill="transparent"
                              stroke="green"
                              strokeWidth="4"
                              strokeDasharray={`${dashLength} ${circumference}`}
                              strokeDashoffset={-offset}
                              strokeLinecap="round"
                            />
                          );
                        })
                      }

                    </svg>

                    <button className='absolute bottom-0 right-0 bg-green-500 text-white p-1 rounded-full'
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCreateModel(true)
                      }}
                    >
                      <FaPlus className='h-2 w-2' />
                    </button>

                  </>
                ) : (

                  <button className='absolute bottom-0 right-0 bg-green-500 text-white p-1 rounded-full'
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCreateModel(true)
                    }}
                  >
                    <FaPlus className='h-2 w-2' />
                  </button>

                )
              }



            </div>

            <div className='flex flex-col items-start flex-1'>
              <p className='font-semibold'>
                My Status
              </p>
              <p className={`text-sm ${theme === 'dark' ? "text-gray-400" : "text-gray-500"} `}
              >
                {
                  userStatuses ? `${userStatuses.statuses.length} status ${userStatuses?.statuses.length > 1 ? "es" : ""}  ${formatTimestamp(userStatuses.statuses[userStatuses.statuses.length - 1].timestamp)}` : "Tab to add status update"
                }
              </p>
            </div>
            {userStatuses && (
              <button
                className='ml-auto'
                onClick={() => setShowOption(!showOption)}
              >
                <FaEllipsisH className={` h-5 w-5 ${theme === 'dark' ? "text-gray-400" : "text-gray-500"} `} />
              </button>
            )}

          </div>

          {/* options menu */}

          {showOption && userStatuses && (
            <div
              className={` shadow-md p-2 ${theme === 'dark' ? "bg-[rgb(17,27,33)]" : "bg-white"} `}
            >
              <button
                className='w-full text-left text-green-500 py-2 hover:bg-gray-100 px-2 rounded flex items-center'

                onClick={() => {
                  setShowCreateModel(true);
                  setShowOption(false)
                }}
              >
                <FaCamera className='inline-block mr-2 '/> Add Status
              </button>

              <button
                className='w-full text-left text-green-500 py-2 hover:bg-gray-100 px-2 rounded flex items-center'

                onClick={() => {
                  handleStatusPreview(userStatuses)
                  setShowOption(false)
                }}
              >
                View Status
              </button>
            </div>
          )}


          {
            loading && (
              <div className='flex justify-center items-center p-8'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2  border-green-500'>

                </div>
              </div>
            )
          }


          {/* recent stsus bupdats for the other users */}

          {
            !loading && statuses.length > 0 && (
              <div

                className={`p-4 space-y-4 shadow-md mt-4 ${theme === 'dark' ? "bg-[rgb(17,27,33)]" : "bg-white"} `}
              >

                <h3
                  className={`font-semibold ${theme === 'dark' ? "text-gray-400" : "text-gray-500"}`}

                >
                  Recents Update
                </h3>

                {
                  otherStatuses.map((contact, index) => (
                    <React.Fragment key={contact?._id}>
                      <StatusList
                        contact={contact}
                        onPreview={() => handleStatusPreview(contact)}
                        theme={theme}
                      />

                      {index < otherStatuses.length - 1 && (
                        <hr
                          className={theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}
                        />
                      )}
                    </React.Fragment>
                  ))
                }

              </div>
            )
          }


          {/* empty stus not stutaus found */}

          {
             !loading && (!statuses || statuses.length === 0) && (
    
              <div className='flex flex-col items-center justify-center p-8 text-center'>
                <div className={`text-6xl mb-4 ${theme === 'dark' ? "text-gray-400" : "text-gray-500"}`}>
                  📱
                </div>

                <h3 className={`text-lg font-semibold  mb-2 ${theme === 'dark' ? "text-gray-400" : "text-gray-500"}`}>
                  no status  updated yet
                </h3>
                <p className={`text-sm   mb-2 ${theme === 'dark' ? "text-gray-400" : "text-gray-500"}`}>
                  be the first share status
                </p>
              </div>
            )
          }

        </div>



        {showCreateModel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className={`w-full max-w-md rounded-xl p-5 shadow-lg
        ${theme === 'dark' ? 'bg-[rgb(17,27,33)] text-white' : 'bg-white text-black'}
      `}
            >
              {/* Header */}
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Create Status</h2>
                <button
                  onClick={() => setShowCreateModel(false)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <RxCross2 className="h-5 w-5" />
                </button>
              </div>

              {/* Text input */}
              <textarea
                placeholder="What's on your mind?"
                rows={3}
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className={`mb-4 w-full resize-none rounded-lg border p-3 text-sm outline-none
          ${theme === 'dark'
                    ? 'border-gray-700 bg-transparent text-white focus:border-green-500'
                    : 'border-gray-300 text-black focus:border-green-500'}
        `}
              />

              {/* File upload */}
              <label
                className={`mb-4 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed p-4 text-sm
          ${theme === 'dark'
                    ? 'border-gray-600 text-gray-400 hover:border-green-500'
                    : 'border-gray-300 text-gray-500 hover:border-green-500'}
        `}
              >
               
                <input
                  type="file"
                  accept="image/*,video/*"
                  
                  onChange={handleFileChange}
                />
              </label>

              {/* Preview */}
              {filePreview && (
                <div className="mb-4 overflow-hidden rounded-lg">
                  {selectdFile?.type.startsWith('video/') ? (
                    <video
                      src={filePreview}
                      controls
                      className="h-40 w-full object-cover"
                    />
                  ) : (
                    <img
                      src={filePreview}
                      alt="Preview"
                      className="h-40 w-full object-cover"
                    />
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowCreateModel(false)}
                  className={`rounded-lg px-4 py-2 text-sm
            ${theme === 'dark'
                      ? 'text-gray-300 hover:bg-gray-800'
                      : 'text-gray-600 hover:bg-gray-100'}
          `}
                >
                  Cancel
                </button>

                <button
                  onClick={handleCreateStatus}
                  disabled={loading || (!newStatus.trim() && !selectdFile)}
                  className="rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50"
                >
                  {loading ? "creating..." : "Create"}
                </button>
              </div>
            </motion.div>
          </div>
        )}





      </motion.div>


    </Layout>
  );

}




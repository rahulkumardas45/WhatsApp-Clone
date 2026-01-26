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
  const [selectedFile, setSelectedFile] = useState(null);
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

  // console.log( "this my ststus",statuses)

  const userStatuses = getUserStatuses(user?._id);
   console.log("this is user ",userStatuses)
  
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
    return () => 
      clearError();
    
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
  };

  // create the new status

  const handleCreateStatus = async () => {
    if (!newStatus.trim() && !selectedFile) {
      return;
    }

    try {
      await createStatus({
        content: newStatus,
        file: selectedFile
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
   try {
     setPreviewContact(null);
     setCurrentStatusIndex(0);
     console.log("status close susseffully")
   } catch (error) {
    console.error("error in close the ststus", error)
   }
  }

  // component render

  const handlePreviewNext = () => {
     if (!previewContact) return;

    if (currentStatusIndex < previewContact.statuses.length -1) {
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

   console.log(contact.statuses)

    if (contact && contact.statuses && contact.statuses[statusIndex]) {
      handleViewStatus(contact.statuses[statusIndex].id);
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
            loading={loading}
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

        <div className={`  flex justify-between items-center shadow-md ${theme === 'dark' ? "bg-[rgb(17,27,33)] " : "bg-white"} p-4 `}>
          <h2 className='text-2xl font-bold'>Status</h2>
        </div>


        {/* // show the error if occur */}

        {
          error && (<div className='bg-red-200 border border-red-400 text-red-700 px-4 py-3 rounded mx-4 mt-2'>
            <span className='block sm:inline'>{error}</span>
            <button onClick={clearError} className='float-right text-red-500 hover:text-red-700'>
              <RxCross2 className='h-5 w-5' />
            </button>
          </div>)
        }


{/* // status section part */}

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
                        
                          const circumference = 2 * Math.PI * 48;
                          const segmentLength = circumference / userStatuses.statuses.length;
                          const offset = index * segmentLength;

                          return (
                            <circle
                              key={index}
                              r="48"
                              cx="50"
                              cy="50"
                              fill="none"
                              stroke="#25D366"
                              strokeWidth="4"
                              strokeDasharray={`${segmentLength-5} 5`}
                              strokeDashoffset={-offset}
                              transform={`rotate(-90 50 50)`}
                            />
                          )
                        })
                      }

                    </svg>

                    <button 
                    className='absolute bottom-0 right-0 bg-green-500 text-white p-1 rounded-full'
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
                  userStatuses ? `${userStatuses?.statuses.length} status ${userStatuses?.statuses.length > 1 ? "es" : ""}  ${formatTimestamp(userStatuses.statuses[userStatuses.statuses.length - 1].timestamp)}` : "Tab to add status update"
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
                <FaCamera className='inline-block mr-2 ' /> Add Status
              </button>

              <button
                className='w-full text-left text-green-500 py-2 hover:bg-gray-100 px-2 rounded'

                onClick={() => {
                  handleStatusPreview(userStatuses)
                  setShowOption(false)
                }}
              >
                View Status
              </button>
            </div>
          )}

   {/* // when status loading  */}
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
            !loading && otherStatuses.length > 0 && (
              <div

                className={`p-4 space-y-4 shadow-md mt-4 ${theme === 'dark' ? "bg-[rgb(17,27,33)]" : "bg-white"} `}
              >

                <h3
                  className={`font-semibold ${theme === 'dark' ? "text-gray-400" : "text-gray-500"}`}
                >
                  Recents Update
                </h3>

                {
                  otherStatuses?.map((contact, index) => (
                    <React.Fragment key={contact?.id}>
                      <StatusList
                        contact={contact}
                        onPreview={() => handleStatusPreview(contact)}
                        theme={theme}
                      />

                      {index < otherStatuses.length -1 && (
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


          {/* empty status not stutaus found */}

          {
            !loading && otherStatuses.length == 0 && (

              <div className='flex flex-col items-center justify-center p-8 text-center'>
                <div className={`text-6xl mb-4 ${theme === 'dark' ? "text-gray-400" : "text-gray-500"}`}>
                  📱
                </div>

                <h3 className={`text-lg font-semibold  mb-2 ${theme === 'dark' ? "text-gray-400" : "text-gray-500"}`}>
                  No status  updated yet
                </h3>
                <p className={`text-sm   mb-2 ${theme === 'dark' ? "text-gray-400" : "text-gray-500"}`}>
                  be the first share status
                </p>
              </div>
            )
          }
        </div>

        {/* //CTAQRE SSATAUS MODEL */}

        {
          showCreateModel && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div
           className={`p-6 rounded-lg max-w-md w-full mx-4 ${theme === 'dark' ? "bg-gray-700" : "bg-white"}`}
          >
           <h3
            className={`text-lg font-semibold mb-4 ${theme === 'dark' ? "text-white" : "text-black"}`}
           >
        Create Status
           </h3>
{/* 
/// preview the sleected file */}


      {filePreview && (
         <div className='mb-4'>
       {
         selectedFile?.type.startsWith("video/") ? (
        <video
         src={filePreview}
         controls
         className='w-full h-32 object-cover rounded'
        />
         ): (
     <img src={filePreview} alt="file-preview"
             className='w-full h-32 object-cover rounded'
           />
         )
       }
     
         </div>
     
       )}


       {/* /// text araea */}
      <textarea
      value={newStatus}
      onChange={(e)=>setNewStatus(e.target.value)}
      placeholder='what is in your mind'
      
  className={`w-full p-3 border rounded-lg mb-4 ${ theme === 'dark' ? "bg-gray-700 text-white border-gray-600":"bg-white text-black border-gray-300"}`}
     rows={3}
      />

 <input
   type='file'
    accept='image/*,video/*'
    onChange={handleFileChange}
    className='mb-4'
 />

 
  <div className='flex justify-end space-x-3'>
    <button
    onClick={()=>{
      setShowCreateModel(false)
      setNewStatus("")
      setSelectedFile(null)
      setFilePreview(null)
    }}

    disabled={loading}
    className='px-4 py-2 text-gray-500 hover:text-gray-700'
    >
      cancel
    </button>

    <button
    onClick={handleCreateStatus}

    disabled={loading || (!newStatus.trim() && !selectedFile)}
    className='px-4 py-2 bg-green-400 text-white rounded hover:bg-green-500 disabled:opacity-50 '
    >
      {loading ? "creating..":"create"}
    </button>
  </div>

          </div>
          </div>
          )
        }

      </motion.div>


    </Layout>
  );

}




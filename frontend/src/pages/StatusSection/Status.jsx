import React, { useEffect, useState } from 'react'
import useThemeStore  from '../../store/themeStore.js';
import userUserStore from '../../store/useUserStore.js';
import useStatusStore from '../../store/useStatusStore.js';



 export const Status = () => {
  const [previewContent, setPreviewContent] = useState(null);

  const [currentStatusIndex, setCurrentStatusIndex] = useState(0);

  const [showOption, setShowOption] = useState(false);
  const [selectdFile, setSelectedFile] = useState(null);
  const [showCreateModel, setShowCreateModel] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  const [filePreview, setFilePreview] = useState(null);


  const {themes} = useThemeStore();
  const {user} = userUserStore();
  

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


const userStaus = getUserStatuses(user?._id);
const otherStatuses = getOtherStatuses(user?._id);

useEffect(()=>{
    fetchStatuses();
    initializeSocket();

    return ()=>{
      cleanupSocket();
      reset();
    }
},[user?._id])


//clear the error
useEffect(()=>{
   return ()=>{
    clearError();
   }
})


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

  const handleCreateStatus = async()=>{
   if(!newStatus.trim() && !selectdFile){
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

  const handleViewStatus = async(statusId)=>{
    try {
     await viewStatus(statusId);
    } catch (error) {
      console.error("view status error", error);
      
    }
  }

  //handle delete

  const handleDeleteStatus = async(statusId)=>{
    try {
     await deleteStatus(statusId);
     setShowOption(false)
     handlePreviewClose();
    } catch (error) {
      console.error("delete status error", error);
      
    }
  }

  //preview close

  const handlePreviewClose = ()=>{
    setPreviewContent(null);
    setCurrentStatusIndex(0);
  }

  // component render

  const handlePreviewNext = ()=>{
     if(currentStatusIndex<previewContent.statuses.length-1){
        setCurrentStatusIndex((prev)=>prev+1);
     }else{
        handlePreviewClose();
     }
  }


  const handlePreviewPrev = ()=>{
    if(currentStatusIndex>0){
       setCurrentStatusIndex((prev)=>Math.max(prev-1,0));
    }
  }



  return (
    <div>Status</div>
  )
}




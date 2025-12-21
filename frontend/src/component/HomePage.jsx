import React, { useEffect, useState } from 'react'
import { Layout } from './Layout'
import { motion } from 'framer-motion'
import { ChatList } from '../pages/chat-section/ChatList'
import useLayoutStore from '../store/layoutStore'
import { getAllUsers } from '../Services/userServices'

export const HomePage = () => {
  //fetch the user 


const [allUsers, setAllUsers] = useState([]);

const getAllUser = async() =>{
  try {
    const result = await getAllUsers();
    if(result.status === 'success'){
      setAllUsers(result.data);
    }

  } catch (error) {
     console.log(error)
  }
}
// uska use load hote use getalluse api call karna automatic 

useEffect(()=>{
  getAllUser();
}, [])

  return (
    <Layout>
       <motion.div
       initial={{opacity:0}}
       animate={{opacity:1}}
       transition={{duration:0.5}}
       className='h-full'
        
       >
        <ChatList contacts={allUsers} />

       </motion.div>
    </Layout>
  )
}

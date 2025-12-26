import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import './App.css';
import Login from './pages/user-login/Login';
import { ToastContainer } from 'react-toastify';
 import 'react-toastify/dist/ReactToastify.css';

import { HomePage } from './component/HomePage';
import { ProtectedRoute, PublicRoute } from './Protected.js';
import { Status } from './pages/StatusSection/Status.jsx';
import { Setting } from './pages/SettingSection/Setting.jsx';
import { UserDetails } from './component/UserDetails.jsx';
import useUserStore from './store/useUserStore.js';
import { disconnectSocket, initializeSocket } from './Services/chatServices.js';
import { useChatStore } from './store/chatStore.js';
function App() {
  
  const {user} = useUserStore();
  const {setCurrentUser,initsocketListners,cleanup} = useChatStore();


  useEffect(() => {
    if(user?._id){
      const socket = initializeSocket();

      if(socket){
        setCurrentUser(user);

        initsocketListners();
      }

    }

     return () => {
       cleanup();
       disconnectSocket();
     }
  },[user,setCurrentUser,initsocketListners,cleanup])

  return (
  <>
  <ToastContainer position='top-right' autoClose={3000}/>
   <Router>
    <Routes>
      <Route element={<PublicRoute/>}>
        <Route path="/login" element={<Login/>} />
      </Route>
      <Route element={<ProtectedRoute/>}>
       <Route path='/' element ={<HomePage/>}/>
        <Route path='/user-profile' element ={<UserDetails/>}/>
         <Route path='/status' element ={<Status/>}/>
          <Route path='/settings' element ={<Setting/>}/>
      </Route>
      
    </Routes>
   </Router>
  </>
  );
}

export default App;

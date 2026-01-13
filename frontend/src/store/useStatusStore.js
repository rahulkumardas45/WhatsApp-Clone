
import { create } from 'zustand'
import { getSocket } from '../Services/chatServices';
import axiosInstance from '../Services/url.services';

const useStatusStore = create(
    (set, get)=>({
        //state
        statuses:[],
        loading:false,
        error:null,
        //actions
        setStatuses: (statuses) => set({ statuses }),
        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error }),
        clearError: () => set({ error: null }),

        //intialize the socket listners

        initializeSocket:()=>{
            const socket = getSocket();
          if(!socket) return;

          // real- time staus events
          socket.on("new_status", (newStatus)=>{
            set((state)=>({
                statuses: state.statuses.some((s) => s._id === newStatus._id) ? state.statuses : [newStatus, ...state.statuses]
            }))

          })
// delete status event
          socket.on("status_deleted", (statusId)=>{
            set((state)=>({
                statuses: state.statuses.filter((s) => s._id !== statusId)
            }))

          });
//viewed status event
          socket.on("status_viewed", (statusId,viewers)=>{
            set((state)=>({
                statuses: state.statuses.map((s) => s._id === statusId ? {...s, viewers} : s)
            }))

          })


        },

        cleanupSocket:()=>{
            const socket = getSocket();
            if(socket){
                socket.off("new_status");
                socket.off("status_deleted");
                socket.off("status_viewed");
            }

        },

        //fetch statuses from server
        fetchStatuses: async(userId)=>{
            set({loading:true, error:null});
            try {
                 const {data} = await axiosInstance.get("status");
                    set({statuses:data.statuses, loading:false});

            } catch (error) {
                console.error("Error fetching statuses:", error);
                set({error:error.message, loading:false});
            }
        },

   // craete status
   createStatus: async(statusData)=>{
     set({loading:true, error:null});

       try {
        const formData = new FormData();

        if(statusData.file){
            formData.append("media", statusData.file);
        }

        if(statusData.content?.trim()){
            formData.append("content", statusData.content.trim());
        }
        //server call

        const {data} = await axiosInstance.post('/status', formData, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });

        //add to status in local store

          if(data.data){

           set((state)=>({
               statuses: state.statuses.some((s) => s._id === data.data._id) ? state.statuses : [data.data, ...state.statuses]
           }))

          }

        
        return data.data;
       } catch (error) {
        console.error("Error creating status:", error);
        set({error:error.message, loading:false});
        throw error;
        
       }
    },

      // viwew ststus

        viewStatus: async(statusId)=>{
             try {
                await axiosInstance.put(`/status/${statusId}/view`);
                
                 set((state)=>({
                    statuses: state.statuses.map((s) => s._id === statusId ? {...s } : s)
                 }))



             } catch (error) {
                console.error("Error viewing status:", error);
                set({error:error.message});
        
             }
        },


        //deletet status
        deleteStatus: async(statusId)=>{
            set({loading:true, error:null});
           try {
               await axiosInstance.delete(`/status/${statusId}`);
                set((state)=>(
                    {
                        statuses: state.statuses.filter((s) => s._id !== statusId),
                        loading:false
                    }
                ))
           } catch (error) {
            console.error("Error deleting status:", error);
            set({error:error.message, loading:false});
            throw error;
            
           }
        },

        //get status viewers

        getStatusViewers: async(statusId)=>{
            
              try {
                set({loading:true, error:null});
                  const {data} = await axiosInstance.get(`/status/${statusId}/viewers`);
              
                  return data.data;
              } catch (error) {
                console.error("Error fetching status viewers:", error);
                set({error:error.message, loading:false});
                throw error;
            
              }
            },

     // helper function for grouped ststus
     getGroupedStatus : ()=>{
        const {statuses} = get();

       return statuses.reduce((acc,status)=>{
           const statusUserId  = status.user?._id;

           if(!acc[statusUserId]){
             acc[statusUserId]={
                id:statusUserId,
                name:status?.user?.username,
                avatar:status?.user?.profilepicture,
                statuses:[]

             }
           }

           acc[statusUserId].statuses.push({
            id:status._id,
            media:status.media,
            contentType:status.contentType,
            timestamp:status.createdAt,
            viewers:status.viewers,
           });

           return acc;

       }, {})

     },


     getUserStatuses : (userId)=>{
        const groupedStatus = get().getGroupedStatus();

        return userId ? groupedStatus[userId] : null;

     },

     getOtherStatuses : (userId)=>{
        const groupedStatus = get().getGroupedStatus();

        return Object.values(groupedStatus).filter((contact)=> contact.id !== userId);

     },


     

     //reset store
        reset:()=>{
            set({
                statuses:[],
                loading:false,
                error:null,
            })
        },
 
    })
)

export default useStatusStore;
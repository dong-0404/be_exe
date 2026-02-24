import { configureStore } from '@reduxjs/toolkit'
import { counterReducer } from '../features/counter'
import findTutorReducer from '../features/findTutor/findTutorSlice'
import communityReducer from '../features/community/communitySlice'
import chatReducer from '../features/chat/chatSlice'

export const store = configureStore({
    reducer: {
        counter: counterReducer,
        findTutor: findTutorReducer,
        community: communityReducer,
        chat: chatReducer,
    },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch


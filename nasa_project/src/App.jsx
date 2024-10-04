import { Children, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import RootPage from './pages/RootPage'
import { RouterProvider, createBrowserRouter } from "react-router-dom";
function App() {
const router = createBrowserRouter([{
path: "/",
element: <RootPage />,
// Children:[
// {
//   path:"/",
//   element: <HomePage />
// },
// {path: "/todaysCard",
// element: <TodayCard />
// },
// {
//   path: "/game",
//   element: <Game />
// },
// {
//   path: "/library",
//   element: <Library />
// }
// ]
}])

    
  return(
    <div className='App'>
      <RouterProvider router={router}/>
    </div>
  )
  
}

export default App

import {useEffect, useState} from 'react'
import API from './api/api'

const App = () => {
  const [data, setData] = useState(null);

  return (
    <div className="text-6xl text-red-500">
      <button onClick={() => API.post("/api/health", {message: "Hello"})}>Click Me</button>
    </div>
  )
}

export default App
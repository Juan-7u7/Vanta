import Sidebar from './components/Sidebar'
import './App.css'

function App() {
  return (
    <>
      <div className="fixed inset-0 -z-10 h-full w-full bg-white [background:radial-gradient(125%_125%_at_50%_10%,#fff_40%,#281C59_100%)] dark:[background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#281C59_100%)] dark:items-center dark:px-5 dark:py-24"></div>
      
      <div className="min-h-screen relative z-0 flex">
        <Sidebar />
        <main className="flex-1 transition-all duration-[400ms] lg:pl-[120px] p-6 lg:py-10 lg:pr-10">
          
        </main>
      </div>
    </>
  )
}

export default App

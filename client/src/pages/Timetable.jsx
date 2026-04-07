import { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Calendar, Clock, MapPin, User, Download } from 'lucide-react';

export default function Timetable() {
  const [view, setView] = useState('week');
  
  const schedule = {
    Monday: [
      { time: '09:00 AM', subject: 'Data Structures', room: 'Room 201', faculty: 'Prof. Smith' },
      { time: '11:00 AM', subject: 'Algorithms', room: 'Room 305', faculty: 'Prof. Johnson' },
    ],
    Tuesday: [
      { time: '10:00 AM', subject: 'Database Systems', room: 'Room 102', faculty: 'Prof. Williams' },
      { time: '02:00 PM', subject: 'Web Development', room: 'Lab 3', faculty: 'Prof. Brown' },
    ],
    Wednesday: [
      { time: '09:00 AM', subject: 'Data Structures', room: 'Room 201', faculty: 'Prof. Smith' },
    ],
    Thursday: [
      { time: '11:00 AM', subject: 'Algorithms', room: 'Room 305', faculty: 'Prof. Johnson' },
      { time: '03:00 PM', subject: 'Database Systems', room: 'Room 102', faculty: 'Prof. Williams' },
    ],
    Friday: [
      { time: '10:00 AM', subject: 'Web Development', room: 'Lab 3', faculty: 'Prof. Brown' },
    ],
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Class Timetable
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Your weekly class schedule</p>
              </div>
              <div className="flex gap-3">
                <button className="btn-secondary flex items-center gap-2">
                  <Download size={18} />
                  <span>Export</span>
                </button>
                <button className="btn-primary">
                  Sync with Google Calendar
                </button>
              </div>
            </div>
            
            {/* View Toggle */}
            <div className="flex gap-2 mb-8">
              {['week', 'month'].map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    view === v
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)} View
                </button>
              ))}
            </div>
            
            {/* Weekly Schedule */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {Object.entries(schedule).map(([day, classes]) => (
                <div key={day} className="card-elevated p-4">
                  <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">{day}</h3>
                  <div className="space-y-3">
                    {classes.length > 0 ? (
                      classes.map((cls, index) => (
                        <div key={index} className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock size={14} className="text-indigo-600" />
                            <span className="text-sm font-semibold text-indigo-600">{cls.time}</span>
                          </div>
                          <p className="font-bold text-gray-900 dark:text-white mb-1">{cls.subject}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mb-1">
                            <MapPin size={12} />
                            <span>{cls.room}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <User size={12} />
                            <span>{cls.faculty}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">No classes</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

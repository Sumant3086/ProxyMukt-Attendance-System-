import { useState } from 'react';
import Navbar from '../components/Sidebar';
import Sidebar from '../components/Sidebar';
import { QrCode, MapPin, Clock, CheckCircle, Shield } from 'lucide-react';

export default function QRHistory() {
  const [history] = useState([
    {
      id: 1,
      class: 'Data Structures',
      date: '2024-12-20',
      time: '09:15 AM',
      location: 'Room 201',
      verificationMethods: ['QR Code', 'Face Liveness', 'GPS'],
      coordinates: { lat: 28.6139, lng: 77.2090 },
      status: 'success',
    },
    {
      id: 2,
      class: 'Algorithms',
      date: '2024-12-19',
      time: '11:05 AM',
      location: 'Room 305',
      verificationMethods: ['QR Code', 'GPS'],
      coordinates: { lat: 28.6140, lng: 77.2091 },
      status: 'success',
    },
  ]);
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-5xl mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                QR Scan History
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">View your attendance scan history</p>
            </div>
            
            <div className="space-y-4">
              {history.map((record) => (
                <div key={record.id} className="card-elevated p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                        <QrCode className="text-green-600" size={24} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{record.class}</h3>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            <span>{new Date(record.date).toLocaleDateString()} at {record.time}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin size={14} />
                            <span>{record.location}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <CheckCircle className="text-green-600" size={24} />
                  </div>
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Verification Methods Used:</p>
                    <div className="flex flex-wrap gap-2">
                      {record.verificationMethods.map((method, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 rounded-full text-sm font-semibold flex items-center gap-1"
                        >
                          <Shield size={14} />
                          {method}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      GPS: {record.coordinates.lat.toFixed(4)}, {record.coordinates.lng.toFixed(4)}
                    </p>
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

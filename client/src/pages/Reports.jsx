import { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { FileText, Download, Calendar, Filter } from 'lucide-react';

export default function Reports() {
  const [reportType, setReportType] = useState('monthly');
  const [selectedClass, setSelectedClass] = useState('all');
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Reports
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">Generate and download attendance reports</p>
            </div>

            {/* Report Filters */}
            <div className="card-elevated p-4 sm:p-6 mb-6 sm:mb-8">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Generate Report</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    Report Type
                  </label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="input-primary"
                  >
                    <option value="daily">Daily Report</option>
                    <option value="weekly">Weekly Report</option>
                    <option value="monthly">Monthly Report</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    Class
                  </label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="input-primary"
                  >
                    <option value="all">All Classes</option>
                    <option value="cs101">CS101 - Data Structures</option>
                    <option value="cs102">CS102 - Algorithms</option>
                  </select>
                </div>
                
                <div className="flex items-end">
                  <button className="btn-primary w-full flex items-center justify-center gap-2">
                    <Download size={18} />
                    <span>Generate Report</span>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Recent Reports */}
            <div className="card-elevated p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Recent Reports</h2>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="text-indigo-600" size={24} />
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">Monthly Report - December 2024</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Generated on Dec 31, 2024</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

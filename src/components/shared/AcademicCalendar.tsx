import { Calendar as CalendarIcon, Flag, BookOpen } from 'lucide-react';

const EVENTS = [
  { id: 1, date: '2026-01-01', title: 'New Year\'s Day', type: 'holiday' },
  { id: 2, date: '2026-01-12', title: 'Start of Term 2', type: 'academic' },
  { id: 3, date: '2026-01-14', title: 'Makara Sankranti / Pongal', type: 'holiday' },
  { id: 4, date: '2026-01-26', title: 'Republic Day', type: 'holiday' },
  { id: 5, date: '2026-02-16', title: 'Maha Shivaratri', type: 'holiday' },
  { id: 6, date: '2026-03-04', title: 'Holi', type: 'holiday' },
  { id: 7, date: '2026-03-15', title: 'Mid-Term Examinations Begin', type: 'exam' },
  { id: 8, date: '2026-03-20', title: 'Ugadi (Telugu New Year)', type: 'holiday' },
  { id: 9, date: '2026-03-28', title: 'Sri Rama Navami', type: 'holiday' },
  { id: 10, date: '2026-04-14', title: 'Dr. Ambedkar Jayanti', type: 'holiday' },
  { id: 11, date: '2026-05-01', title: 'Summer Vacation Begins', type: 'holiday' },
  { id: 12, date: '2026-07-01', title: 'Start of Term 3', type: 'academic' },
  { id: 13, date: '2026-08-15', title: 'Independence Day', type: 'holiday' },
  { id: 14, date: '2026-08-28', title: 'Raksha Bandhan', type: 'holiday' },
  { id: 15, date: '2026-09-04', title: 'Janmashtami', type: 'holiday' },
  { id: 16, date: '2026-09-14', title: 'Vinayaka Chavithi', type: 'holiday' },
  { id: 17, date: '2026-10-02', title: 'Gandhi Jayanti', type: 'holiday' },
  { id: 18, date: '2026-10-10', title: 'Dasara / Vijayadashami', type: 'holiday' },
  { id: 19, date: '2026-11-01', title: 'Final Examinations Begin', type: 'exam' },
  { id: 20, date: '2026-11-08', title: 'Diwali / Deepavali', type: 'holiday' },
  { id: 21, date: '2026-12-25', title: 'Christmas Day', type: 'holiday' },
];

export function AcademicCalendar() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-blue-600" />
          2026 Academic Calendar
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar" style={{ maxHeight: '380px' }}>
        {EVENTS.map((event) => {
          const isHoliday = event.type === 'holiday';
          const isExam = event.type === 'exam';
          const dateObj = new Date(event.date);
          const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
          const day = dateObj.getDate();

          return (
            <div key={event.id} className="flex flex-row items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
              <div className={`flex flex-col items-center justify-center min-w-[50px] p-2 rounded-lg shadow-sm
                ${isHoliday ? 'bg-green-50 text-green-700' : isExam ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                <span className="text-xs font-bold uppercase tracking-wider">{month}</span>
                <span className="text-lg font-extrabold leading-none mt-1">{day}</span>
              </div>
              
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800 text-sm">{event.title}</h4>
                <div className="flex items-center gap-1.5 mt-1">
                  {isHoliday && <Flag className="w-3 h-3 text-green-500" />}
                  {isExam && <BookOpen className="w-3 h-3 text-red-500" />}
                  {!isHoliday && !isExam && <CalendarIcon className="w-3 h-3 text-blue-500" />}
                  <span className={`text-[10px] font-bold uppercase tracking-wider
                    ${isHoliday ? 'text-green-600' : isExam ? 'text-red-600' : 'text-blue-600'}`}>
                    {event.type}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

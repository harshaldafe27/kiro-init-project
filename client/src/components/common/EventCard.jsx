import { formatDate } from '../../utils/formatDate';

export default function EventCard({ event, onRegister, onEdit, onDelete, role, isRegistered }) {
  const isPast = new Date(event.date) < new Date();
  const isFull = event.registeredCount >= event.capacity;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-md transition-shadow">
      {event.banner ? (
        <img src={event.banner} alt={event.title} className="w-full h-40 object-cover" />
      ) : (
        <div className="w-full h-40 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <span className="text-white text-4xl">🎉</span>
        </div>
      )}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-gray-900 dark:text-white text-base leading-tight">{event.title}</h3>
          {event.fee > 0 ? (
            <span className="shrink-0 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full">₹{event.fee}</span>
          ) : (
            <span className="shrink-0 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">Free</span>
          )}
        </div>
        {event.category && (
          <span className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full">{event.category}</span>
        )}
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 line-clamp-2">{event.description}</p>
        <div className="mt-3 space-y-1 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1.5">📅 <span>{formatDate(event.date)}</span></div>
          <div className="flex items-center gap-1.5">📍 <span>{event.venue}</span></div>
          <div className="flex items-center gap-1.5">👥 <span>{event.registeredCount}/{event.capacity} registered</span></div>
        </div>

        {role === 'student' && (
          <button onClick={() => onRegister(event)} disabled={isPast || isFull || isRegistered}
            className={`mt-4 w-full py-2 rounded-xl text-sm font-medium transition-colors ${
              isRegistered ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 cursor-default'
              : isPast || isFull ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}>
            {isRegistered ? '✓ Registered' : isPast ? 'Deadline Passed' : isFull ? 'Full' : 'Register'}
          </button>
        )}

        {role === 'admin' && (
          <div className="mt-4 flex gap-2">
            <button onClick={() => onEdit(event)} className="flex-1 py-2 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Edit</button>
            <button onClick={() => onDelete(event._id)} className="flex-1 py-2 rounded-xl text-sm font-medium bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 hover:bg-red-100 transition-colors">Delete</button>
          </div>
        )}
      </div>
    </div>
  );
}

import { useRef } from 'react';
import { formatDate } from '../../utils/formatDate';

/**
 * DigitalTicket — renders a styled ticket and provides download as image/PDF.
 * Props:
 *   ticket: { specialId, studentName, eventName, eventDate, venue, fee,
 *             paymentStatus, teamName?, teamMembers?[] }
 *   onClose: () => void
 */
export default function DigitalTicket({ ticket, onClose }) {
  const ticketRef = useRef(null);

  const handleDownloadImage = async () => {
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(ticketRef.current, { scale: 2, useCORS: true });
    const link = document.createElement('a');
    link.download = `ticket-${ticket.specialId}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleDownloadPDF = async () => {
    const { default: html2canvas } = await import('html2canvas');
    const { jsPDF } = await import('jspdf');
    const canvas = await html2canvas(ticketRef.current, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width / 2, canvas.height / 2] });
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
    pdf.save(`ticket-${ticket.specialId}.pdf`);
  };

  const isPaid = ticket.paymentStatus === 'paid';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg space-y-4">
        {/* Ticket card */}
        <div
          ref={ticketRef}
          className="bg-white rounded-3xl overflow-hidden shadow-2xl select-none"
          style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
        >
          {/* Header strip */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 flex items-center justify-between">
            <div>
              <p className="text-indigo-200 text-xs font-semibold uppercase tracking-widest">EventFlex</p>
              <h2 className="text-white text-xl font-bold mt-0.5 leading-tight">{ticket.eventName}</h2>
            </div>
            <div className="text-right">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${isPaid ? 'bg-green-400 text-green-900' : 'bg-white/20 text-white'}`}>
                {isPaid ? '✓ PAID' : ticket.paymentStatus?.toUpperCase() || 'FREE'}
              </span>
            </div>
          </div>

          {/* Tear line */}
          <div className="flex items-center">
            <div className="w-5 h-5 rounded-full bg-gray-100 -ml-2.5 shrink-0" />
            <div className="flex-1 border-t-2 border-dashed border-gray-200 mx-1" />
            <div className="w-5 h-5 rounded-full bg-gray-100 -mr-2.5 shrink-0" />
          </div>

          {/* Body */}
          <div className="px-6 py-5 grid grid-cols-2 gap-4">
            <TicketField label="Attendee" value={ticket.studentName} />
            <TicketField label="Special ID" value={ticket.specialId} mono />
            <TicketField label="Date" value={ticket.eventDate ? formatDate(ticket.eventDate) : '—'} />
            <TicketField label="Venue" value={ticket.venue || '—'} />
            {ticket.fee > 0 && <TicketField label="Amount Paid" value={`₹${ticket.fee}`} />}
            {ticket.teamName && <TicketField label="Team" value={ticket.teamName} />}
          </div>

          {/* Team members */}
          {ticket.teamMembers?.length > 0 && (
            <div className="px-6 pb-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Team Members</p>
              <div className="space-y-1">
                {ticket.teamMembers.map((m, i) => (
                  <div key={i} className="text-xs text-gray-600 flex gap-2">
                    <span className="font-medium">{m.name}</span>
                    <span className="text-gray-400">·</span>
                    <span>{m.btId}</span>
                    <span className="text-gray-400">·</span>
                    <span>{m.branch}, {m.year}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tear line */}
          <div className="flex items-center">
            <div className="w-5 h-5 rounded-full bg-gray-100 -ml-2.5 shrink-0" />
            <div className="flex-1 border-t-2 border-dashed border-gray-200 mx-1" />
            <div className="w-5 h-5 rounded-full bg-gray-100 -mr-2.5 shrink-0" />
          </div>

          {/* QR placeholder + footer */}
          <div className="px-6 py-5 flex items-center justify-between gap-4">
            {/* QR code placeholder */}
            <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center shrink-0 border border-gray-200">
              <QRPlaceholder value={ticket.specialId} />
            </div>
            <div className="flex-1 text-right">
              <p className="text-xs text-gray-400">Scan at entry</p>
              <p className="text-xs font-mono text-gray-500 mt-1 break-all">{ticket.specialId}</p>
              <p className="text-xs text-gray-300 mt-2">eventflex.app</p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleDownloadImage}
            className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors"
          >
            ⬇ Download Image
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex-1 py-3 rounded-xl bg-white hover:bg-gray-50 text-gray-800 text-sm font-semibold border border-gray-200 transition-colors"
          >
            ⬇ Download PDF
          </button>
          <button
            onClick={onClose}
            className="px-4 py-3 rounded-xl bg-white hover:bg-gray-50 text-gray-500 text-sm border border-gray-200 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

function TicketField({ label, value, mono }) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">{label}</p>
      <p className={`text-sm text-gray-800 font-semibold mt-0.5 ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}

/** SVG-based QR placeholder that visually resembles a QR code */
function QRPlaceholder({ value = '' }) {
  // Deterministic pseudo-random grid from specialId chars
  const cells = Array.from({ length: 49 }, (_, i) => {
    const c = value.charCodeAt(i % value.length) || 0;
    return (c + i * 7) % 3 !== 0;
  });
  return (
    <svg viewBox="0 0 70 70" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      {/* Corner squares */}
      {[[2,2],[2,52],[52,2]].map(([x,y],i) => (
        <g key={i}>
          <rect x={x} y={y} width={16} height={16} rx="2" fill="#1e1b4b" />
          <rect x={x+3} y={y+3} width={10} height={10} rx="1" fill="white" />
          <rect x={x+5} y={y+5} width={6} height={6} rx="0.5" fill="#1e1b4b" />
        </g>
      ))}
      {/* Data cells */}
      {cells.map((on, i) => {
        const col = i % 7;
        const row = Math.floor(i / 7);
        const x = 22 + col * 7;
        const y = 22 + row * 7;
        return on ? <rect key={i} x={x} y={y} width={5} height={5} rx="0.5" fill="#1e1b4b" /> : null;
      })}
    </svg>
  );
}

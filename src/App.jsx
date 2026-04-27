import React, { useState, useEffect } from 'react';
import { Printer, Download, Plus, Trash2, Building2, Store } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import fieldMap from './fieldMap.json';

const BusinessTypes = {
  ANUAR: 'ANUAR',
  SEKH: 'SEKH'
};

function numberToIndianWords(num) {
  if (num === 0 || !num) return "";
  const single = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const double = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "Ten", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  
  const formatTenth = (digit, prev) => {
    if (digit === 0) return single[prev];
    if (digit === 1) return double[prev];
    return prev === 0 ? tens[digit] : tens[digit] + " " + single[prev];
  };

  let str = num.toString().split('.')[0];
  if (str.length > 9) return "Overflow";
  str = ("000000000" + str).slice(-9);

  const cr = Number(str.slice(0, 2));
  const lk = Number(str.slice(2, 4));
  const th = Number(str.slice(4, 6));
  const hd = Number(str.slice(6, 7));
  const t = Number(str.slice(7, 9));

  let words = "";
  if (cr > 0) words += formatTenth(Math.floor(cr / 10), cr % 10) + " Crore ";
  if (lk > 0) words += formatTenth(Math.floor(lk / 10), lk % 10) + " Lakh ";
  if (th > 0) words += formatTenth(Math.floor(th / 10), th % 10) + " Thousand ";
  if (hd > 0) words += single[hd] + " Hundred ";
  if (t > 0) words += formatTenth(Math.floor(t / 10), t % 10) + " " ;

  return words.trim() + " Rupees Only";
}

const INITIAL_STATE = {
  business: BusinessTypes.ANUAR,
  slNo: '',
  date: new Date().toLocaleDateString('en-GB'),
  customerName: '',
  utr: '',
  transactionId: '',
  items: Array(10).fill({ description: '', qnty: '', rate: '', amount: '', p: '' }),
  rupeesInWords: '',
  totalAmount: '0.00'
};

function App() {
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCoords({ x: x.toFixed(1), y: y.toFixed(1) });
  };

  useEffect(() => {
    // Sync total calculation
    const total = formData.items.reduce((acc, item) => {
      const amt = parseFloat(item.amount) || 0;
      return acc + amt;
    }, 0);
    const totalStr = total.toFixed(2);
    setFormData(prev => ({ 
      ...prev, 
      totalAmount: totalStr,
      rupeesInWords: total > 0 ? numberToIndianWords(total) : ''
    }));
  }, [formData.items]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    const newItem = { ...newItems[index], [field]: value };
    
    // Auto calculate amount if quantity and rate are present
    if (field === 'qnty' || field === 'rate') {
      const q = parseFloat(field === 'qnty' ? value : newItem.qnty) || 0;
      const r = parseFloat(field === 'rate' ? value : newItem.rate) || 0;
      newItem.amount = (q * r).toFixed(2);
    }
    
    newItems[index] = newItem;
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const handlePrint = () => {
  window.print();
};

// Download the invoice as a single‑page PDF
const downloadPdf = async () => {
  const element = document.querySelector('.invoice-paper');
  const canvas = await html2canvas(element, { scale: 2, useCORS: true, allowTaint: true });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ unit: 'pt', format: [canvas.width, canvas.height] });
  pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
  pdf.save('invoice.pdf');
};

// Calibration state
const [calibrating, setCalibrating] = useState(false);
const [currentField, setCurrentField] = useState('name');
const [fieldMap, setFieldMap] = useState({});
const [lastCoord, setLastCoord] = useState(null);

// Capture click coordinates during calibration
const handleClick = (e) => {
  const rect = e.currentTarget.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;
  const coord = { x: x.toFixed(1), y: y.toFixed(1) };
  setFieldMap(prev => ({ ...prev, [currentField]: coord }));
  setLastCoord(coord);
};

// Export the collected field map as JSON
const exportMap = () => {
  const dataStr = JSON.stringify(fieldMap, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'fieldMap.json';
  a.click();
  URL.revokeObjectURL(url);
};

  return (
    <div className="invoice-container">
      <div className="sidebar no-print">
        <h2 className="font-heading" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Store className="text-primary" /> Invoice Generator
          </h2>

          <div className="business-selector">
            <div
              className={`business-card ${formData.business === BusinessTypes.ANUAR ? 'active' : ''}`}
              onClick={() => handleInputChange('business', BusinessTypes.ANUAR)}
            >
              <Store size={24} style={{ marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>Anuar Ali</div>
            </div>
            <div
              className={`business-card ${formData.business === BusinessTypes.SEKH ? 'active' : ''}`}
              onClick={() => handleInputChange('business', BusinessTypes.SEKH)}
            >
              <Building2 size={24} style={{ marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>Sekh Hardware</div>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Sl. No.</label>
            <input className="input-field" value={formData.slNo} onChange={(e) => handleInputChange('slNo', e.target.value)} placeholder="e.g. 123/24" />
          </div>

          <div className="input-group">
            <label className="input-label">Date</label>
            <input className="input-field" value={formData.date} onChange={(e) => handleInputChange('date', e.target.value)} placeholder="e.g. 27/04/2026" />
          </div>

          <div className="input-group">
            <label className="input-label">Customer Name</label>
            <input className="input-field" value={formData.customerName} onChange={(e) => handleInputChange('customerName', e.target.value)} />
          </div>

          <div className="input-group">
            <label className="input-label">UTR Number</label>
            <input className="input-field" value={formData.utr} onChange={(e) => handleInputChange('utr', e.target.value)} />
          </div>

          <div className="input-group">
            <label className="input-label">Transaction ID</label>
            <input className="input-field" value={formData.transactionId} onChange={(e) => handleInputChange('transactionId', e.target.value)} />
          </div>

          <div style={{ marginTop: '2rem' }}>
            <h3 className="input-label" style={{ marginBottom: '1rem' }}>Items (Top 5)</h3>
            {formData.items.slice(0, 5).map((item, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input className="input-field" placeholder="Description" value={item.description} onChange={(e) => handleItemChange(idx, 'description', e.target.value)} />
                <input className="input-field" placeholder="Qty" value={item.qnty} onChange={(e) => handleItemChange(idx, 'qnty', e.target.value)} />
                <input className="input-field" placeholder="Rate" value={item.rate} onChange={(e) => handleItemChange(idx, 'rate', e.target.value)} />
              </div>
            ))}
          </div>

          <div className="input-group" style={{ marginTop: '2rem' }}>
            <label className="input-label">Amount in Words (Auto-calculated)</label>
            <textarea className="input-field" rows="2" value={formData.rupeesInWords} readOnly style={{ backgroundColor: '#f0f0f0' }} />
          </div>

          <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} onClick={handlePrint}>
            <Printer size={20} /> Print / Save as PDF
          </button>
        </div>

        <div className="preview-area">
          <div style={{ position: 'fixed', bottom: 10, right: 10, background: '#000', color: '#fff', padding: '5px 10px', borderRadius: '5px', zIndex: 1000, fontSize: '12px' }}>
            X: {coords.x}% | Y: {coords.y}%
          </div>
          <div onMouseMove={handleMouseMove}>
            <InvoicePreview data={formData} />
          </div>
        </div>
      </div>
  );
}

const InvoicePreview = ({ data }) => {
  const isAnuar = data.business === BusinessTypes.ANUAR;
  const bgImage = isAnuar ? `${import.meta.env.BASE_URL}anwar_orig.jpeg` : `${import.meta.env.BASE_URL}shek_orig.jpeg`;
  
  return (
    <div className="invoice-paper" style={{ 
      position: 'relative',
      fontFamily: "Arial, sans-serif",
      fontWeight: 'normal',
      fontSize: '18px',
      color: '#000',
      overflow: 'hidden'
    }}>
      <img src={bgImage} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }} crossOrigin="anonymous" alt="Background" />
      {/* Date */}
      {fieldMap[data.business].date && (
        <div style={{ position: 'absolute', top: `${fieldMap[data.business].date.y}%`, left: `${fieldMap[data.business].date.x}%`, width: '200px', fontWeight: 'bold' }}>
          [DATE: {data.date}]
        </div>
      )}

      {/* Sl. No. */}
      <div style={{ position: 'absolute', top: `${fieldMap[data.business].slNo.y}%`, left: `${fieldMap[data.business].slNo.x}%`, width: '120px', fontWeight: 'bold' }}>
        {data.slNo}
      </div>

      {/* Name */}
      <div style={{ position: 'absolute', top: `${fieldMap[data.business].name.y}%`, left: `${fieldMap[data.business].name.x}%`, width: '80%', fontWeight: 'bold' }}>
        {data.customerName}
      </div>

      {/* UTR */}
      <div style={{ position: 'absolute', top: `${fieldMap[data.business].utr.y}%`, left: `${fieldMap[data.business].utr.x}%`, width: '80%', fontWeight: 'bold' }}>
        {data.utr}
      </div>

      {/* Transaction ID */}
      <div style={{ position: 'absolute', top: `${fieldMap[data.business].transactionId.y}%`, left: `${fieldMap[data.business].transactionId.x}%`, width: '70%', fontWeight: 'bold' }}>
        {data.transactionId}
      </div>

      {/* Table Items */}
      {/* Table Items */}
      {data.items.slice(0, 5).map((item, idx) => {
        const topY = fieldMap[data.business].items.startY + (idx * fieldMap[data.business].items.rowHeight);
        return (
          <div key={idx}>
            <div style={{ position: 'absolute', top: `${topY}%`, left: `${fieldMap[data.business].items.descX}%`, width: '35%' }}>
              {item.description}
            </div>
            <div style={{ position: 'absolute', top: `${topY}%`, left: `${fieldMap[data.business].items.qtyX}%`, width: '50px', textAlign: 'center' }}>
              {item.qnty}
            </div>
            <div style={{ position: 'absolute', top: `${topY}%`, left: `${fieldMap[data.business].items.rateX}%`, width: '60px', textAlign: 'center' }}>
              {item.rate}
            </div>
            <div style={{ position: 'absolute', top: `${topY}%`, left: `${fieldMap[data.business].items.amountX}%`, width: '15%', textAlign: 'right' }}>
              {item.amount ? item.amount.split('.')[0] : ''}
            </div>
            <div style={{ position: 'absolute', top: `${topY}%`, left: `${fieldMap[data.business].items.pX}%`, width: '30px', textAlign: 'center' }}>
              {item.amount ? (item.amount.split('.')[1] || '00') : ''}
            </div>
          </div>
        );
      })}

      {/* Total */}
      <div style={{ position: 'absolute', top: `${fieldMap[data.business].total.y}%`, left: `${fieldMap[data.business].total.x}%`, width: '15%', textAlign: 'right' }}>
          {data.totalAmount.split('.')[0]}
      </div>
      <div style={{ position: 'absolute', top: `${fieldMap[data.business].total.y}%`, left: `${fieldMap[data.business].items.pX}%`, width: '30px', textAlign: 'center' }}>
          {data.totalAmount.split('.')[1] || '00'}
      </div>

      {/* Rupees in Words */}
      <div style={{ position: 'absolute', top: `${fieldMap[data.business].words.y}%`, left: `${fieldMap[data.business].words.x}%`, width: '70%', fontSize: '16px' }}>
        {data.rupeesInWords}
      </div>
    </div>
  );
};

export default App;

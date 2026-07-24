:root {
  font-family: Arial, Helvetica, sans-serif;
  color: #172033;
  background: #f4f7fb;
}

* { box-sizing: border-box; }
body { margin: 0; min-height: 100vh; background: linear-gradient(135deg, #eef3f9 0%, #f9fbfd 100%); }
button, input, select { font: inherit; }

.page-shell {
  width: min(1100px, calc(100% - 32px));
  margin: 0 auto;
  padding: 48px 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 430px);
  gap: 24px;
  align-items: start;
}

.card {
  background: #fff;
  border: 1px solid #e5eaf1;
  border-radius: 24px;
  box-shadow: 0 18px 50px rgba(38, 55, 81, 0.09);
}

.form-card { padding: 34px; }
.qr-card { padding: 28px; text-align: center; }
.heading-wrap h1, .qr-header h2 { margin: 8px 0 10px; }
.heading-wrap h1 { font-size: clamp(28px, 4vw, 42px); }
.heading-wrap p { margin: 0 0 28px; color: #687386; line-height: 1.6; }
.eyebrow { font-size: 12px; font-weight: 800; letter-spacing: 1.8px; color: #1b65d8; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
label { display: grid; gap: 8px; }
label span { font-size: 14px; font-weight: 700; }
.full-width { grid-column: 1 / -1; }
input, select {
  width: 100%;
  height: 50px;
  border: 1px solid #dce3ec;
  border-radius: 13px;
  padding: 0 14px;
  outline: none;
  background: #fbfcfe;
}
input:focus, select:focus { border-color: #1b65d8; box-shadow: 0 0 0 3px rgba(27, 101, 216, 0.12); }
.money-input { position: relative; }
.money-input input { padding-right: 42px; }
.money-input b { position: absolute; right: 15px; top: 50%; transform: translateY(-50%); color: #526078; }

.primary-button, .secondary-button {
  border: 0;
  border-radius: 13px;
  min-height: 50px;
  padding: 0 20px;
  cursor: pointer;
  font-weight: 800;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.primary-button { grid-column: 1 / -1; background: #1b65d8; color: white; }
.primary-button:hover { background: #1457bd; }
.secondary-button { background: #edf3fb; color: #173d75; }

.qr-image { width: min(100%, 330px); display: block; margin: 16px auto 20px; border-radius: 18px; }
.payment-info { display: grid; gap: 0; border: 1px solid #e3e9f1; border-radius: 16px; overflow: hidden; text-align: left; }
.payment-info div { padding: 13px 15px; display: flex; justify-content: space-between; gap: 16px; border-bottom: 1px solid #e8edf3; }
.payment-info div:last-child { border-bottom: 0; }
.payment-info span { color: #738096; }
.payment-info strong { text-align: right; word-break: break-word; }
.action-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 18px; }

@media (max-width: 850px) {
  .page-shell { grid-template-columns: 1fr; padding: 24px 0; }
}

@media (max-width: 580px) {
  .form-card, .qr-card { padding: 22px; border-radius: 18px; }
  .form-grid { grid-template-columns: 1fr; }
  .full-width, .primary-button { grid-column: auto; }
  .payment-info div { flex-direction: column; gap: 4px; }
  .payment-info strong { text-align: left; }
}

@media print {
  body { background: white; }
  .page-shell { display: block; width: 100%; padding: 0; }
  .no-print { display: none !important; }
  .qr-card { box-shadow: none; border: 0; width: 100%; max-width: 500px; margin: 0 auto; }
}

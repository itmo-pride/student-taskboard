import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Modal from './Modal';
import Constants from '../pages/Constants';
import Formulas from '../pages/Formulas';

export default function Layout() {
  const [openConstants, setOpenConstants] = useState(false);
  const [openFormulas, setOpenFormulas] = useState(false);

  return (
    <div>
      <Navbar
        onOpenConstants={() => setOpenConstants(true)}
        onOpenFormulas={() => setOpenFormulas(true)}
      />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
        <Outlet />
      </div>

      <Modal
        open={openConstants}
        onClose={() => setOpenConstants(false)}
        title="Physical Constants"
        width={900}
      >
        <Constants />
      </Modal>

      <Modal
        open={openFormulas}
        onClose={() => setOpenFormulas(false)}
        title="Formulas"
        width={900}
      >
        <Formulas />
      </Modal>
    </div>
  );
}

import React from 'react';
import logoX from '/src/assets/X-light-logo-corner-32x32.svg';
import { LuHistory } from "react-icons/lu";
import { IoAdd, IoTrashOutline } from 'react-icons/io5';

export default function Sidebar({ isOpen, toggleSidebar }) {

  return (
    <aside
      className={`fixed top-0 left-0 z-30 flex flex-col h-screen bg-secondary/70 backdrop-blur-sm text-[15px] border-r border-[#413c4b] transition-[width,min-width] duration-300 ease-in-out ${isOpen ? 'w-[220px] min-w-[220px]' : 'w-[50px] min-w-[50px]'}`}
      onMouseEnter={() => !isOpen && toggleSidebar()}
      onMouseLeave={() => isOpen && toggleSidebar()}
    >
      {/* Logo — centered in collapsed, left-padded in expanded */}
      <div className="relative mb-4 after:content-[''] after:absolute after:bottom-0 after:left-[10px] after:right-[10px] after:h-[1px] after:bg-[rgb(65,60,75)]">
        <div className={`flex items-center h-[52px] overflow-hidden pl-[14px]`}>
          <img src={logoX} alt="MaxFinder logo" className="h-5 w-5 flex-shrink-0" />
          <span className={`whitespace-nowrap overflow-hidden transition-[width,opacity,margin] duration-300 ease-in-out text-primary text-base font-semibold uppercase tracking-[0.50em] ${isOpen ? 'w-auto opacity-100 ml-3' : 'w-0 opacity-0 ml-0'}`} style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>Chat Dox</span>
        </div>
      </div>


    </aside>
  );
}
'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@mondaysagefx/ui';

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isSmsOpen, setIsSmsOpen] = useState(false);

  const menuItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: '📊',
    },
    {
      label: 'SMS',
      icon: '📱',
      submenu: [
        {
          label: 'SMS Automation',
          path: '/dashboard/sms/automation',
          icon: '🤖',
        },
        {
          label: 'Message Templates',
          path: '/dashboard/sms/templates',
          icon: '📝',
        },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-16">
      <nav className="p-4">
        {menuItems.map(item => (
          <div key={item.label}>
            {item.submenu ? (
              <div>
                <button
                  onClick={() => setIsSmsOpen(!isSmsOpen)}
                  className="w-full flex items-center justify-between p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <span className="flex items-center">
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                  </span>
                  <span>{isSmsOpen ? '▼' : '▶'}</span>
                </button>
                {isSmsOpen && (
                  <div className="ml-4 mt-2 space-y-2">
                    {item.submenu.map(subItem => (
                      <Button
                        key={subItem.path}
                        variant="ghost"
                        className={`w-full justify-start ${
                          pathname === subItem.path ? 'bg-gray-100' : ''
                        }`}
                        onClick={() => router.push(subItem.path)}
                      >
                        <span className="mr-2">{subItem.icon}</span>
                        {subItem.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Button
                variant="ghost"
                className={`w-full justify-start ${pathname === item.path ? 'bg-gray-100' : ''}`}
                onClick={() => router.push(item.path)}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </Button>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}

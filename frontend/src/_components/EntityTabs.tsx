'use client';
import { InformationCircleIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { usePathname } from 'next/navigation';

export default function EntityTabs({ basePath }: { basePath: string }) {
  const currentPath = usePathname();

  const tabs = [
    { name: 'Information', href: basePath, icon: InformationCircleIcon, exact: true },
    { name: 'Service History', href: `${basePath}/services`, icon: WrenchScrewdriverIcon, exact: false },
  ];

  return (
    <div className="pt-4 px-2 xl:px-5">
      <div className="grid grid-cols-1 sm:hidden">
        <select
          defaultValue={tabs.find(t => t.exact ? currentPath === t.href : currentPath.startsWith(t.href))?.href ?? basePath}
          aria-label="Select a tab"
          className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-2 pr-8 pl-3 text-sm font-medium text-gray-900 outline-1 -outline-offset-1 outline-gray-300"
          onChange={(e) => { window.location.href = e.currentTarget.value; }}
        >
          {tabs.map(tab => <option key={tab.name} value={tab.href}>{tab.name}</option>)}
        </select>
      </div>
      <div className="hidden sm:block">
        <nav aria-label="Tabs" className="-mb-px flex space-x-8">
          {tabs.map(tab => {
            const isActive = tab.exact ? currentPath === tab.href : currentPath.startsWith(tab.href);
            return (
              <a
                key={tab.name}
                href={tab.href}
                className={clsx(
                  isActive ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                  'group inline-flex items-center border-b-2 px-1 py-4 text-sm font-medium',
                )}
              >
                <tab.icon aria-hidden="true" className={clsx(isActive ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500', 'mr-2 -ml-0.5 size-5')} />
                {tab.name}
              </a>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

/**
 * @file Sidebar.tsx
 * @description Tab navigation sidebar for switching between Positions, Assignments, Strategies, and Pipeline views.
 *
 * @features
 * - Renders four tab buttons with icons and labels
 * - Highlights the active tab with background and accent indicator
 * - Uses named icons from lucide-react
 */

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

interface TabItem {
  id: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
  label: string;
}

const tabs: TabItem[] = [
  { id: 'positions', icon: (props: any) => <Database {...props} />, label: 'Positions' },
  { id: 'assignments', icon: (props: any) => <Layers {...props} />, label: 'Assignments' },
  { id: 'strategies', icon: (props: any) => <Zap {...props} />, label: 'Strategies' },
  { id: 'steps', icon: (props: any) => <Box {...props} />, label: 'Pipeline' },
];

export const Sidebar = ({ activeTab, onTabChange }: SidebarProps): JSX.Element => {
  return (
    <aside className="w-full lg:w-48 flex flex-col gap-1 shrink-0">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center gap-3 px-3 py-2 border border-[#0D0D0D] transition-all duration-200 group relative overflow-hidden ${
            activeTab === tab.id
              ? 'bg-[#0D0D0D] text-[#F4F4F0]'
              : 'bg-transparent hover:bg-[#0D0D0D] hover:text-[#F4F4F0]'
          }`}
        >
          <tab.icon
            size={14}
            className={activeTab === tab.id ? 'text-[#FF4500]' : 'group-hover:text-[#FF4500]'}
          />
          <span className="uppercase text-xs tracking-widest font-semibold">{tab.label}</span>
          {activeTab === tab.id && <div className="absolute right-0 top-0 bottom-0 w-1 bg-[#FF4500]"></div>}
        </button>
      ))}
    </aside>
  );
};
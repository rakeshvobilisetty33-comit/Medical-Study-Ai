import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import SearchBar from './components/SearchBar';
import Home from './pages/Home';
import StudyWorkspace from './pages/StudyWorkspace';
import Flashcards from './pages/Flashcards';
import Quiz from './pages/Quiz';
import StudyPlanner from './pages/StudyPlanner';
import Progress from './pages/Progress';
import Settings from './pages/Settings';
import CreateWorkspaceModal from './components/CreateWorkspaceModal';
import TopicStudySpace from './pages/TopicStudySpace';
import { storage } from './utils/storage';
import { workspaceAPI } from './services/api';

const App: React.FC = () => {
  const [userName, setUserName] = useState<string>(storage.getUserName() || 'Medical Student');

  const [activePage, setActivePage] = useState<string>('dashboard');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Study Space state
  const [studySpaceWorkspaceId, setStudySpaceWorkspaceId] = useState<string>('');
  const [studySpaceTopic, setStudySpaceTopic] = useState<string>('');
  const [studySpaceSubject, setStudySpaceSubject] = useState<string>('');
  
  // Refresh sidebar triggers
  const [workspacesRefresh, setWorkspacesRefresh] = useState(0);

  // Modals status
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalDefaultSubject, setModalDefaultSubject] = useState('Anatomy');
  const [modalDefaultTitle, setModalDefaultTitle] = useState('');

  const handleOpenCreateWorkspace = (defaultSubject?: string, defaultTitle?: string) => {
    setModalDefaultSubject(defaultSubject || 'Anatomy');
    setModalDefaultTitle(defaultTitle || '');
    setShowCreateModal(true);
  };

  const handleCreateWorkspace = async ({
    title,
    subject,
    topic
  }: {
    title: string;
    subject: string;
    topic?: string;
  }) => {
    const created = await workspaceAPI.create({
      title,
      subject,
      topic
    });

    setShowCreateModal(false);
    triggerWorkspacesRefresh();

    const id = created?._id ?? (created as any)?.id;
    if (!id) throw new Error('Created workspace has no ID');

    handleNavigatePage('workspace', id);
  };

  const triggerWorkspacesRefresh = () => {
    setWorkspacesRefresh(prev => prev + 1);
  };

  const handleUpdateName = (name: string) => {
    setUserName(name);
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to clear your local student profile details?')) {
      storage.clearUserName();
      storage.clearLastWorkspace();
      setUserName('');
      setActivePage('dashboard');
      setSelectedWorkspaceId('');
    }
  };

  const handleNavigatePage = (page: string, id?: string) => {
    setActivePage(page);
    setIsMobileSidebarOpen(false);
    if (id) {
      setSelectedWorkspaceId(id);
      storage.setLastWorkspace(id);
    }
  };

  const handleOpenStudySpace = (workspaceId: string, topic: string, subject: string) => {
    setStudySpaceWorkspaceId(workspaceId);
    setStudySpaceTopic(topic);
    setStudySpaceSubject(subject);
    setActivePage('study-space');
  };

  // Sync dark theme on launch
  useEffect(() => {
    const root = window.document.documentElement;
    const theme = storage.getTheme();
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Auto load last active workspace on return
    const lastWs = storage.getLastWorkspace();
    if (lastWs && userName) {
      setSelectedWorkspaceId(lastWs);
      setActivePage('workspace');
    }
  }, [userName]);

  // 1. RENDER WELCOME OR NAME PROMPT (If userName is not set)
  if (!userName) {
    return (
      <Home 
        userName={userName} 
        setUserName={setUserName} 
        onNavigatePage={handleNavigatePage} 
        refreshWorkspacesTrigger={triggerWorkspacesRefresh}
        workspacesRefresh={workspacesRefresh}
        onOpenCreateWorkspace={handleOpenCreateWorkspace}
      />
    );
  }

  // 2. MAIN LAYOUT FOR VERIFIED STUDENTS
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-darkbg-200">
      {/* Header bar */}
      <Navbar 
        userName={userName}
        onLogout={handleLogout}
        onOpenSearch={() => setShowSearchModal(true)}
        onOpenSettings={() => handleNavigatePage('settings')}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        
        {/* Navigation Sidebar */}
        <Sidebar
          activePage={activePage}
          onChangePage={handleNavigatePage}
          selectedWorkspaceId={selectedWorkspaceId}
          refreshTrigger={workspacesRefresh}
          onOpenCreateWorkspace={() => handleOpenCreateWorkspace()}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />


        {/* Content Viewer Panel */}
        <main className={`flex-1 min-h-0 ${activePage === 'workspace' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          {activePage === 'dashboard' && (
            <Home 
              userName={userName}
              setUserName={setUserName}
              onNavigatePage={handleNavigatePage}
              refreshWorkspacesTrigger={triggerWorkspacesRefresh}
              workspacesRefresh={workspacesRefresh}
              onOpenCreateWorkspace={handleOpenCreateWorkspace}
            />
          )}

          {activePage === 'workspace' && selectedWorkspaceId && (
            <StudyWorkspace
              workspaceId={selectedWorkspaceId}
              onNavigateHome={() => handleNavigatePage('dashboard')}
              onRefreshSidebar={triggerWorkspacesRefresh}
            />
          )}

          {activePage === 'flashcards' && (
            <Flashcards
              initialWorkspaceId={selectedWorkspaceId}
            />
          )}
          
          {activePage === 'quiz' && (
            <Quiz
              initialWorkspaceId={selectedWorkspaceId}
            />
          )}
          
          {activePage === 'planner' && (
            <StudyPlanner onOpenStudySpace={handleOpenStudySpace} />
          )}
          
          {activePage === 'study-space' && studySpaceWorkspaceId && studySpaceTopic && (
            <TopicStudySpace
              workspaceId={studySpaceWorkspaceId}
              topic={studySpaceTopic}
              subject={studySpaceSubject}
              onBackToPlanner={() => handleNavigatePage('planner')}
            />
          )}
          
          {activePage === 'progress' && <Progress />}
          
          {activePage === 'settings' && (
            <Settings 
              userName={userName} 
              onUpdateName={handleUpdateName} 
            />
          )}
        </main>
      </div>

      {/* GLOBAL SEARCH DIALOG */}
      <SearchBar
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onNavigate={handleNavigatePage}
      />

      {/* GLOBAL CREATE WORKSPACE MODAL */}
      <CreateWorkspaceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateWorkspace}
        defaultSubject={modalDefaultSubject}
        defaultTitle={modalDefaultTitle}
      />

    </div>
  );
};

export default App;

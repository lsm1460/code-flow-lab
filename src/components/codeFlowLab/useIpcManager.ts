import { store } from '@/App';
import {
  CHECK_SAVED,
  CREATE_DOCUMENT,
  OPEN_BROWSER,
  OPEN_PROJECT,
  REQUEST_PROJECT,
  REQUEST_SAVE,
  REQUEST_SAVE_STATE,
  SAVE_FILE,
  SET_DOCUMENT,
  REQUEST_MINIMIZE,
  REQUEST_MAXIMIZE,
  CLOSE_WINDOW,
  REQUEST_CONTEXT,
} from '@/consts/channel.js';
import { RootState } from '@/reducers';
import {
  resetDocumentValueAction,
  setDocumentAction,
  setIsSaveStateAction,
} from '@/reducers/contentWizard/mainDocument';
import { useDispatch } from 'react-redux';

const useIpcManager = (_ableReceive: boolean = true) => {
  const dispatch = useDispatch();

  const { ipcRenderer } = window.electron;

  if (_ableReceive) {
    ipcRenderer.on(REQUEST_PROJECT, (e, msg) => {
      const { contentDocument }: RootState = store.getState();

      ipcRenderer.send(SAVE_FILE, contentDocument);
      dispatch(setIsSaveStateAction(true));
    });

    ipcRenderer.on(SET_DOCUMENT, (e, document) => {
      dispatch(setDocumentAction(document));
    });

    ipcRenderer.on(CREATE_DOCUMENT, () => {
      dispatch(resetDocumentValueAction());
    });

    ipcRenderer.on(REQUEST_SAVE_STATE, () => {
      const { isSaved }: RootState = store.getState();

      ipcRenderer.send(CHECK_SAVED, isSaved);
    });
  }

  const sendDocumentForSave = () => {
    ipcRenderer.send(REQUEST_SAVE);
  };

  const sendOpenBrowser = (_link) => {
    ipcRenderer.send(OPEN_BROWSER, _link);
  };

  const sendOpenProject = (_path) => {
    ipcRenderer.send(OPEN_PROJECT, _path);
  };

  const sendMinimizeRequest = () => {
    ipcRenderer.send(REQUEST_MINIMIZE);
  };

  const sendMaximizeRequest = () => {
    ipcRenderer.send(REQUEST_MAXIMIZE);
  };

  const sendCloseRequest = () => {
    ipcRenderer.send(CLOSE_WINDOW);
  };

  const sendContextOpen = (_payload?: { itemId: string; groupId: string; isGroup: boolean; isRoot: boolean }) => {
    ipcRenderer.send(REQUEST_CONTEXT, _payload);
  };

  return {
    sendDocumentForSave,
    sendOpenBrowser,
    sendOpenProject,
    sendMinimizeRequest,
    sendMaximizeRequest,
    sendCloseRequest,
    sendContextOpen,
  };
};

export default useIpcManager;

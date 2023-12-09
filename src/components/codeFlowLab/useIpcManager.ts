import { store } from '@/App';
import {
  CLOSE_WINDOW,
  CREATE_DOCUMENT,
  DEBUG,
  OPEN_BROWSER,
  OPEN_MENU,
  OPEN_PROJECT,
  REQUEST_CONTEXT,
  REQUEST_MAXIMIZE,
  REQUEST_MINIMIZE,
  REQUEST_PROJECT,
  REQUEST_SAVE,
  SAVE_FILE,
  SET_DOCUMENT,
  SET_BROWSER_ID,
} from '@/consts/channel.js';
import { RootState } from '@/reducers';
import {
  resetDocumentValueAction,
  setBrowserIdAction,
  setDocumentAction,
  setIsSaveStateAction,
} from '@/reducers/contentWizard/mainDocument';
import { useDispatch } from 'react-redux';

const useIpcManager = (_ableReceive: boolean = true) => {
  const dispatch = useDispatch();

  const { ipcRenderer } = window.electron;

  if (_ableReceive) {
    ipcRenderer.on(SET_BROWSER_ID, (e, _id) => {
      dispatch(setBrowserIdAction(_id));
    });

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

    ipcRenderer.on(DEBUG, (e, msg) => {
      alert(JSON.stringify(msg));
    });
  }

  const sendDocumentForSave = () => {
    const { browserId }: RootState = store.getState();

    ipcRenderer.send(`${browserId}:${REQUEST_SAVE}`);
  };

  const sendOpenBrowser = (_link) => {
    const { browserId }: RootState = store.getState();

    ipcRenderer.send(`${browserId}:${OPEN_BROWSER}`, _link);
  };

  const sendOpenProject = (_path) => {
    const { browserId }: RootState = store.getState();

    ipcRenderer.send(`${browserId}:${OPEN_PROJECT}`, _path);
  };

  const sendMinimizeRequest = () => {
    const { browserId }: RootState = store.getState();

    ipcRenderer.send(`${browserId}:${REQUEST_MINIMIZE}`);
  };

  const sendMaximizeRequest = () => {
    const { browserId }: RootState = store.getState();

    ipcRenderer.send(`${browserId}:${REQUEST_MAXIMIZE}`);
  };

  const sendCloseRequest = () => {
    const { browserId }: RootState = store.getState();

    ipcRenderer.send(`${browserId}:${CLOSE_WINDOW}`);
  };

  const sendOpenHeaderMenu = () => {
    const { browserId }: RootState = store.getState();

    ipcRenderer.send(`${browserId}:${OPEN_MENU}`);
  };

  const sendContextOpen = (_payload?: {
    itemId?: string;
    groupId?: string;
    isGroup?: boolean;
    isRoot?: boolean;
    selectedIdList?: string[];
  }) => {
    const { browserId }: RootState = store.getState();

    ipcRenderer.send(`${browserId}:${REQUEST_CONTEXT}`, _payload);
  };

  return {
    sendDocumentForSave,
    sendOpenBrowser,
    sendOpenProject,
    sendMinimizeRequest,
    sendMaximizeRequest,
    sendCloseRequest,
    sendContextOpen,
    sendOpenHeaderMenu,
  };
};

export default useIpcManager;

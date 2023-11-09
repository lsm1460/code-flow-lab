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

  return {
    sendDocumentForSave,
    sendOpenBrowser,
    sendOpenProject,
  };
};

export default useIpcManager;

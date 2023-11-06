import { store } from '@/App';
import { CREATE_DOCUMENT, REQUEST_PROJECT, SAVE_FILE, SET_DOCUMENT } from '@/consts/channel.js';
import { RootState } from '@/reducers';
import { resetDocumentValueAction, setDocumentAction } from '@/reducers/contentWizard/mainDocument';
import { useDispatch } from 'react-redux';

const IpcManager = () => {
  const dispatch = useDispatch();

  const { ipcRenderer } = window.require('electron');

  ipcRenderer.on(REQUEST_PROJECT, (e, msg) => {
    const { contentDocument }: RootState = store.getState();

    ipcRenderer.send(SAVE_FILE, contentDocument);
  });

  ipcRenderer.on(SET_DOCUMENT, (e, { path, document }) => {
    dispatch(setDocumentAction(document));
  });

  ipcRenderer.on(CREATE_DOCUMENT, () => {
    dispatch(resetDocumentValueAction());
  });

  return <></>;
};

export default IpcManager;

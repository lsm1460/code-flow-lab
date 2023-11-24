import configureStore from '@/reducers/configureStore';
import { Provider } from 'react-redux';
import CodeFlowLabViewer from './components/codeFlowLab/viewer';
import './globals.css';

export const store = configureStore();

function App() {
  return (
    <Provider store={store}>
      <CodeFlowLabViewer />
    </Provider>
  );
}
export default App;

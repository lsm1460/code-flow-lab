import configureStore from '@/reducers/configureStore';
import { Provider } from 'react-redux';
import CodeFlowLabEditor from './components/codeFlowLab/editor';
import './globals.css';

export const store = configureStore();

function App() {
  return (
    <Provider store={store}>
      <CodeFlowLabEditor />
    </Provider>
  );
}
export default App;

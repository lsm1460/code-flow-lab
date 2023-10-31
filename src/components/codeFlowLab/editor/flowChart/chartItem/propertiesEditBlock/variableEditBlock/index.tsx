import { RootState } from '@/reducers';
import { Operation, setDocumentValueAction } from '@/reducers/contentWizard/mainDocument';
import { getSceneId } from '@/utils/content';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import TextEditBlock from '../textEditBlock';
import ToggleEditBlock from '../toggleEditBlock';

interface Props {
  id: string;
  isGlobal: boolean;
  variable: string;
}
function VariableEditBlock({ id, isGlobal, variable }: Props) {
  const dispatch = useDispatch();

  const sceneId = useSelector(
    (state: RootState) => getSceneId(state.contentDocument.scene, state.sceneOrder),
    shallowEqual
  );

  const toggleCallback = (_toggle: boolean) => {
    let value = '';

    if (!_toggle) {
      value = sceneId;
    }

    const operation: Operation = { key: `items.${id}.sceneId`, value };
    dispatch(setDocumentValueAction(operation));
  };

  return (
    <div>
      <ToggleEditBlock label="global" toggleCallback={toggleCallback} onoff={isGlobal} />
      <TextEditBlock id={id} text={variable} propertyKey="var" />
    </div>
  );
}

export default VariableEditBlock;

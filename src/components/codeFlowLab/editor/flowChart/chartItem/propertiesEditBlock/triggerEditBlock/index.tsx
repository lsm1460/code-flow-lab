import { TRIGGER_TYPE } from '@/consts/codeFlowLab/items';
import PropertyBlock from '../propertyBlock';
import { useDispatch } from 'react-redux';
import { setDocumentValueAction } from '@/reducers/contentWizard/mainDocument';

interface Props {
  id: string;
  triggerType: string;
}
function TriggerEditBlock({ id, triggerType }: Props) {
  const dispatch = useDispatch();

  const triggerList = TRIGGER_TYPE.map((_t) => ({ value: _t, label: _t }));

  const onChangeValue = (_key, _val) => {
    dispatch(setDocumentValueAction({ key: `items.${id}.triggerType`, value: _val }));
  };

  return (
    <div>
      <PropertyBlock
        id={id}
        propertyKey={'trigger'}
        value={triggerType}
        onChangeValue={onChangeValue}
        valueList={triggerList}
      />
    </div>
  );
}

export default TriggerEditBlock;

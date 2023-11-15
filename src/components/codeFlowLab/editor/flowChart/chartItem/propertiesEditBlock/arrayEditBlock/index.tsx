import { SCROLL_CLASS_PREFIX } from '@/consts/codeFlowLab/items';
import { ChartArrayItem } from '@/consts/types/codeFlowLab';
import { RootState } from '@/reducers';
import { Operation, setDocumentValueAction } from '@/reducers/contentWizard/mainDocument';
import { getSceneId } from '@/utils/content';
import classNames from 'classnames/bind';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import TextEditBlock from '../textEditBlock';
import ToggleEditBlock from '../toggleEditBlock';
import styles from './arrayEditBlock.module.scss';
const cx = classNames.bind(styles);

interface Props {
  id: string;
  isGlobal: boolean;
  list: ChartArrayItem['list'];
}
function ArrayEditBlock({ id, isGlobal, list }: Props) {
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
      <div className={cx('property-list', { [SCROLL_CLASS_PREFIX]: true })}>
        {[...list, ''].map((_var, _i) => (
          <TextEditBlock key={_i} id={id} text={_var} propertyKey={`list.${_i}`} />
        ))}
      </div>
    </div>
  );
}

export default ArrayEditBlock;

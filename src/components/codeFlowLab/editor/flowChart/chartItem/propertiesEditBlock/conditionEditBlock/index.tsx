import { SCROLL_CLASS_PREFIX } from '@/consts/codeFlowLab/items';
import { ChartConditionItem, ConnectPoint } from '@/consts/types/codeFlowLab';
import { setDocumentValueAction } from '@/reducers/contentWizard/mainDocument';
import classNames from 'classnames/bind';
import { MouseEventHandler } from 'react';
import { useDispatch } from 'react-redux';
import TextEditBlock from '../textEditBlock';
import styles from './conditionEditBlock.module.scss';
const cx = classNames.bind(styles);
//

interface Props {
  id: string;
  textList: string[];
  conditions: ChartConditionItem['conditions'];
  connectionVariables: ConnectPoint[];
  handlePointConnectStart: MouseEventHandler<HTMLElement>;
}
function ConditionEditBlock({ id, textList, conditions, connectionVariables, handlePointConnectStart }: Props) {
  const dispatch = useDispatch();

  const toggleLogical = (_index: number) => {
    const _list = ['==', '!=', '&&', '||'];

    const _conIndex = _list.indexOf(conditions);

    const _nextCon = _conIndex + 1 > _list.length - 1 ? _list[0] : _list[_conIndex + 1];

    dispatch(
      setDocumentValueAction({
        key: `items.${id}.conditions`,
        value: _nextCon,
      })
    );
  };

  return (
    <div>
      {textList.map((_text, _i) => (
        <div className={cx('property-wrap')} key={_i}>
          {_i > 0 && (
            <button className={cx('logical', { [SCROLL_CLASS_PREFIX]: true })} onClick={() => toggleLogical(_i - 1)}>
              {conditions}
            </button>
          )}

          <TextEditBlock
            id={id}
            propertyKey={`textList.${_i}`}
            text={_text}
            pointInfo={{
              pointIndex: _i,
              connectPoint: connectionVariables[_i],
              handlePointConnectStart,
            }}
          />
        </div>
      ))}
    </div>
  );
}

export default ConditionEditBlock;

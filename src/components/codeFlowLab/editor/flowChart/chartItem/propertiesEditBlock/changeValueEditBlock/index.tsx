import { SCROLL_CLASS_PREFIX } from '@/consts/codeFlowLab/items';
import { ChartItemType, ConnectPoint } from '@/consts/types/codeFlowLab';
import { RootState } from '@/reducers';
import { Operation, setDocumentValueAction } from '@/reducers/contentWizard/mainDocument';
import { MouseEventHandler } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import ConnectDot from '../../connectDot';
import TextEditBlock from '../textEditBlock';
import ToggleEditBlock from '../toggleEditBlock';

import classNames from 'classnames/bind';
import styles from './changeValueEditBlock.module.scss';
const cx = classNames.bind(styles);

const numberOperator = ['-=', '*=', '/='];

interface Props {
  id: string;
  text: string;
  connectionVariables: ConnectPoint[];
  isNumber: boolean;
  operator: string;
  handlePointConnectStart: MouseEventHandler<HTMLElement>;
}
function ChangeValueEditBlock({ id, text, connectionVariables, operator, isNumber, handlePointConnectStart }: Props) {
  const dispatch = useDispatch();

  const chartItems = useSelector((state: RootState) => state.contentDocument.items, shallowEqual);

  const toggleCallback = (_toggle: boolean) => {
    const operations: Operation[] = [{ key: `items.${id}.isNumber`, value: _toggle }];

    if (!_toggle && numberOperator.includes(operator)) {
      operations.push({ key: `items.${id}.operator`, value: '=' });
    }

    dispatch(setDocumentValueAction(operations));
  };

  const handleChangeOperator = () => {
    let operatorList = ['=', '+='];
    if (isNumber) {
      operatorList = [...operatorList, ...numberOperator];
    }

    let _nextIndex = operatorList.indexOf(operator) + 1;

    _nextIndex = operatorList.length > _nextIndex ? _nextIndex : 0;

    const operation: Operation = { key: `items.${id}.operator`, value: operatorList[_nextIndex] };

    dispatch(setDocumentValueAction(operation));
  };

  return (
    <div>
      <ToggleEditBlock label="use by number" toggleCallback={toggleCallback} onoff={isNumber} />
      <div className={cx('condition-box')}>
        <div className={cx('property-wrap')}>
          <div className={cx('condition-list')}>
            <p className={cx('condition-sub-title')}>
              Variable
              {connectionVariables[0] ? `: ${chartItems?.[connectionVariables[0].connectParentId].name}` : ''}
              <ConnectDot
                parentId={id}
                connectDir={'right'}
                connectType={ChartItemType.variable}
                targetType={ChartItemType.variable}
                index={0}
                typeIndex={0}
                connectParentId={connectionVariables[0]?.connectParentId}
                handlePointConnectStart={handlePointConnectStart}
                isSlave
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '50%',
                }}
              />
            </p>
          </div>
        </div>
      </div>

      <div className={cx('operator-wrap')}>
        <button className={cx('logical', { [SCROLL_CLASS_PREFIX]: true })} onClick={handleChangeOperator}>
          {operator}
        </button>
      </div>

      <TextEditBlock
        id={id}
        text={text}
        propertyKey="text"
        pointInfo={{
          pointIndex: 1,
          connectPoint: connectionVariables[1],
          handlePointConnectStart,
        }}
      />
    </div>
  );
}

export default ChangeValueEditBlock;

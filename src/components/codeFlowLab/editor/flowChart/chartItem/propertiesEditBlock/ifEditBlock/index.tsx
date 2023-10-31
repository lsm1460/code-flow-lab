import { SCROLL_CLASS_PREFIX } from '@/consts/codeFlowLab/items';
import { ChartIfItem, ChartItemType, ConnectPoint } from '@/consts/types/codeFlowLab';
import { RootState } from '@/reducers';
import { Operation, setDocumentValueAction } from '@/reducers/contentWizard/mainDocument';
import classNames from 'classnames/bind';
import _ from 'lodash';
import { MouseEventHandler, useMemo, useState } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import ConnectDot from '../../connectDot';
import styles from './ifEditBlock.module.scss';
const cx = classNames.bind(styles);
//

interface Props {
  id: string;
  conditions: ChartIfItem['conditions'];
  connectionVariables: ConnectPoint[];
  handlePointConnectStart: MouseEventHandler<HTMLElement>;
}
function IfEditBlock({ id, conditions, connectionVariables, handlePointConnectStart }: Props) {
  const dispatch = useDispatch();

  const chartItems = useSelector((state: RootState) => state.contentDocument.items, shallowEqual);

  const [isActiveElse, setIsActiveElse] = useState(false);

  const conditionList = useMemo(() => {
    const variableList = _.compact(connectionVariables);

    const _indexGroup = _.groupBy(variableList, (_var) => _var.index);
    const _typeGroup = _.mapValues(_indexGroup, (_indexGroupVar) =>
      _.groupBy(_indexGroupVar, (__var) => __var.connectType)
    );

    return new Array(1 + (isActiveElse ? 1 : 0)).fill(undefined).map((__, _i) => {
      const condition = (_typeGroup[_i]?.[ChartItemType.variable] || []).map((_point) => ({
        point: _point,
        logical: conditions[_point.connectParentId],
      }));

      if (_typeGroup[_i]) {
        return {
          condition,
          functionPoint: _typeGroup[_i][ChartItemType.function]?.[0],
        };
      } else {
        return {
          condition: [],
          functionPoint: null,
        };
      }
    });
  }, [conditions, connectionVariables, isActiveElse]);

  const handleAddProperty = () => {
    setIsActiveElse(true);
  };

  const handleInactiveElse = () => {
    if (!conditionList[1]) {
      return;
    }

    const connectedIdList = _.compact([
      ...conditionList[1].condition.map(({ point }) => point.connectParentId),
      conditionList[1].functionPoint?.connectParentId,
    ]);

    let operations: Operation[] = [
      {
        key: `items.${id}.connectionVariables`,
        value: _.compact(connectionVariables).filter((_var) => !connectedIdList.includes(_var.connectParentId)),
      },
      {
        key: `items.${id}.conditions`,
        value: _.pickBy(conditions, (_val, _key) => !connectedIdList.includes(_key)),
      },
    ];

    const itemDisconnectOperations: Operation[] = connectedIdList.map((_id) => ({
      key: `items.${_id}.connectionIds.left`,
      value: chartItems[_id].connectionIds['left'].filter((_pos) => _pos.connectParentId !== id),
    }));

    operations = [...operations, ...itemDisconnectOperations];

    dispatch(setDocumentValueAction(operations));

    setIsActiveElse(false);
  };

  const toggleLogical = (_connectedId: string, _logical = '&&') => {
    const logical = _logical === '&&' ? '||' : '&&';

    let operation: Operation = {
      key: `items.${id}.conditions`,
      value: {
        ...conditions,
        [_connectedId]: logical,
      },
    };

    dispatch(setDocumentValueAction(operation));
  };

  return (
    <div>
      {(conditionList || []).map((_conditionBlock, _i) => (
        <div key={_i} className={cx('condition-box')}>
          {_i !== 0 && (
            <button className={cx('delete-button')} onClick={handleInactiveElse}>
              <i className="material-symbols-outlined">close</i>
            </button>
          )}
          <p className={cx('condition-title')}>{_i === 0 ? 'IF' : 'ELSE'}</p>
          <div key={_i} className={cx('property-wrap')}>
            {_i === 0 && (
              <div className={cx('condition-list')}>
                <p className={cx('condition-sub-title')}>condition list</p>
                <ul>
                  {_conditionBlock.condition.map((_conditionItem, _j) => (
                    <li key={_j}>
                      {_j !== 0 && (
                        <button
                          className={cx('logical', { [SCROLL_CLASS_PREFIX]: true })}
                          onClick={() => toggleLogical(_conditionItem.point.connectParentId, _conditionItem.logical)}
                        >
                          {_conditionItem.logical || '&&'}
                        </button>
                      )}
                      <span className={cx('item-name')}>
                        {chartItems?.[_conditionItem.point.connectParentId].name || ''}
                      </span>

                      <ConnectDot
                        parentId={id}
                        connectDir={'right'}
                        connectType={ChartItemType.variable}
                        targetType={ChartItemType.variable}
                        index={_i}
                        typeIndex={_i + _j + 1}
                        connectParentId={_conditionItem.point?.connectParentId}
                        handlePointConnectStart={handlePointConnectStart}
                        isSlave
                      />
                    </li>
                  ))}
                  <li>
                    <ConnectDot
                      parentId={id}
                      connectDir={'right'}
                      connectType={ChartItemType.variable}
                      targetType={ChartItemType.variable}
                      index={_i}
                      typeIndex={_i + _conditionBlock.condition.length + 1}
                      handlePointConnectStart={handlePointConnectStart}
                      isSlave
                    />
                  </li>
                </ul>
              </div>
            )}
            <p className={cx('function-connector')}>
              <span className={cx('condition-sub-title')}>function</span>
              <span className={cx('condition-sub-title')}>
                {_conditionBlock.functionPoint
                  ? `: ${chartItems?.[_conditionBlock.functionPoint.connectParentId].name}`
                  : ''}
              </span>
              <ConnectDot
                parentId={id}
                connectDir={'right'}
                connectType={ChartItemType.function}
                targetType={ChartItemType.function}
                index={_i}
                typeIndex={0}
                handlePointConnectStart={handlePointConnectStart}
                connectParentId={_conditionBlock.functionPoint?.connectParentId}
                isSlave
              />
            </p>
          </div>
        </div>
      ))}

      {(conditionList || []).length < 2 && (
        <button className={cx('property-add-button', { [SCROLL_CLASS_PREFIX]: true })} onClick={handleAddProperty}>
          <i className="material-symbols-outlined">add</i>
        </button>
      )}
    </div>
  );
}

export default IfEditBlock;

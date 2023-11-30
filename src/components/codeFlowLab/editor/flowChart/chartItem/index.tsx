import useIpcManager from '@/components/codeFlowLab/useIpcManager';
import {
  BLOCK_HEADER_SIZE,
  CHART_SCRIPT_ITEMS,
  CONNECT_POINT_GAP,
  CONNECT_POINT_SIZE,
  CONNECT_POINT_START,
  FLOW_CHART_ITEMS_STYLE,
  POINT_LIST_PADDING,
} from '@/consts/codeFlowLab/items';
import { ChartGroupItem, ChartItemType, ChartItems, CodeFlowChartDoc, ConnectPoint } from '@/consts/types/codeFlowLab';
import { RootState } from '@/reducers';
import { setDeleteTargetIdListAction, setDocumentValueAction } from '@/reducers/contentWizard/mainDocument';
import { getSceneId, useDebounceSubmitText } from '@/utils/content';
import classNames from 'classnames/bind';
import _ from 'lodash';
import { KeyboardEventHandler, MouseEventHandler, useEffect, useMemo, useState } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { getBlockType, getConnectSizeByType } from '../utils';
import styles from './chartItem.module.scss';
import ConnectDot from './connectDot';
import PropertiesEditBlock from './propertiesEditBlock';
const cx = classNames.bind(styles);

interface Props {
  chartItems: CodeFlowChartDoc['items'];
  itemInfo: ChartItems;
  isSelected: boolean;
  handleItemMoveStart: (_event: MouseEvent, _selectedItem: ChartItems) => void;
  handlePointConnectStart: MouseEventHandler<HTMLSpanElement>;
}
function ChartItem({ chartItems, itemInfo, isSelected, handleItemMoveStart, handlePointConnectStart }: Props) {
  const dispatch = useDispatch();

  const { sendContextOpen } = useIpcManager(false);

  const [isReadyOnly, setIsReadOnly] = useState(true);
  const [debounceSubmitText] = useDebounceSubmitText(`items.${itemInfo.id}.name`);

  const { rootId, selectedGroupId, group, deleteTargetIdList, sceneItemIds } = useSelector((state: RootState) => {
    const sceneId = getSceneId(state.contentDocument.scene, state.sceneOrder, state.selectedGroupId);

    return {
      rootId: (state.contentDocument.items[state.selectedGroupId] as ChartGroupItem)?.rootId,
      selectedGroupId: state.selectedGroupId,
      deleteTargetIdList: state.deleteTargetIdList,
      sceneItemIds: state.contentDocument.scene[sceneId]?.itemIds || [],
      group: state.contentDocument.group,
    };
  }, shallowEqual);

  const isRoot = rootId === itemInfo.id || itemInfo.elType === ChartItemType.body;

  const checkDeep = ![ChartItemType.trigger, ChartItemType.style, ...CHART_SCRIPT_ITEMS].includes(itemInfo.elType);

  const connectSizeByType = useMemo(() => {
    let _ids = [...sceneItemIds];

    if (selectedGroupId) {
      _ids = group[selectedGroupId];
    }

    return getConnectSizeByType(itemInfo.connectionIds, chartItems, _ids, checkDeep);
  }, [chartItems, itemInfo, sceneItemIds, checkDeep, selectedGroupId, group]);

  const [itemName, setItemName] = useState(itemInfo.name);
  const [isTyping, setIsTyping] = useState(false);
  const [multiDeleteDelay, setMultiDeleteDelay] = useState(-1);

  useEffect(() => {
    if (deleteTargetIdList.length > 0) {
      setMultiDeleteDelay(deleteTargetIdList.indexOf(itemInfo.id) * 100);
    }
  }, [deleteTargetIdList, itemInfo.id]);

  const selectName = (_isTyping, _originText, _insertedText) => {
    if (_isTyping) {
      return _insertedText;
    }

    return _originText;
  };

  const selectedName = useMemo(() => selectName(isTyping, itemInfo.name, itemName), [isTyping, itemInfo, itemName]);
  const connectPointList = useMemo(() => {
    return Object.keys(FLOW_CHART_ITEMS_STYLE[itemInfo.elType].connectionTypeList).map((_x, _i) => {
      const pointList = (itemInfo.connectionIds[_x] || []).filter((_point) => {
        if (selectedGroupId) {
          return group[selectedGroupId].includes(_point.connectParentId);
        }

        return sceneItemIds.includes(_point.connectParentId);
      });
      const typeGroup = _.groupBy(pointList, (_point) => {
        // 일반적으로는 그룹 별로 묶지만, 변수의 경우 다양한 블록들과 그룹지어 연결하지 않기 때문에 분기처리 추가
        if (_point.connectType === ChartItemType.variable) {
          return ChartItemType.variable;
        }

        return getBlockType(chartItems[_point.connectParentId]?.elType, checkDeep);
      });

      return (
        <ul key={_i} className={cx('point-list', _x)}>
          {(FLOW_CHART_ITEMS_STYLE[itemInfo.elType].connectionTypeList[_x] || []).map((_type, _j) => {
            let _pointSize = connectSizeByType[_x][_type] || 0;

            return Array(_pointSize + 1)
              .fill(undefined)
              .map((__, _k) => {
                const _point: ConnectPoint = typeGroup[getBlockType(_type, checkDeep)]?.[_k];
                const _itemName = _point ? chartItems[_point.connectParentId].name : '';

                return (
                  <li
                    key={`${_i}-${_j}-${_k}`}
                    style={{
                      height: 0,
                      marginTop: CONNECT_POINT_GAP + CONNECT_POINT_SIZE,
                    }}
                  >
                    <span className={cx('label', _x)} title={_itemName}>
                      {_itemName}
                    </span>
                    <ConnectDot
                      parentId={itemInfo.id}
                      connectDir={_x as 'left' | 'right'}
                      connectType={_type}
                      targetType={getBlockType(itemInfo.elType, true)}
                      index={_j}
                      typeIndex={_k}
                      connectParentId={_point?.connectParentId}
                      handlePointConnectStart={handlePointConnectStart}
                    />
                  </li>
                );
              });
          })}
        </ul>
      );
    });
  }, [connectSizeByType, sceneItemIds, chartItems, checkDeep, handlePointConnectStart, itemInfo.elType, itemInfo.id]);

  const handleCancelInsert: KeyboardEventHandler<HTMLInputElement> = (_event) => {
    if (_event.code === 'Escape') {
      debounceSubmitText.cancel();

      setIsTyping(false);

      setItemName(itemInfo.name);

      setTimeout(() => {
        (_event.target as HTMLInputElement).blur();
      }, 50);
    }
  };

  const handleTitleInput = (_event) => {
    if (_event.target.value.length < 1) {
      alert('최소 한 글자 이상 입력해주세요.');
      return;
    }

    setIsTyping(true);

    setItemName(_event.target.value);

    debounceSubmitText(_event.target.value);
  };

  const emitText = (_text) => {
    debounceSubmitText.cancel();

    if (_text !== itemInfo.name) {
      dispatch(
        setDocumentValueAction({
          key: `items.${itemInfo.id}.name`,
          value: _text,
        })
      );
    }
  };

  const handleDeleteItem: MouseEventHandler<HTMLButtonElement> = (_event) => {
    _event.stopPropagation();

    if (itemInfo.elType === ChartItemType.body) {
      return;
    }

    dispatch(setDeleteTargetIdListAction([itemInfo.id]));
  };

  const handleContextMenu = (_event) => {
    _event.stopPropagation();

    sendContextOpen({
      itemId: itemInfo.id,
      groupId: selectedGroupId,
      isGroup: itemInfo.elType === ChartItemType.group,
      isRoot,
      ableDelete: !isRoot,
    });
  };

  return (
    <div
      className={cx('chart-item', getBlockType(itemInfo.elType, true), {
        selected: isSelected,
        delete: multiDeleteDelay > -1,
      })}
      data-id={itemInfo.id}
      style={{
        left: itemInfo.pos.left,
        top: itemInfo.pos.top,

        minWidth: FLOW_CHART_ITEMS_STYLE[itemInfo.elType].width,

        zIndex: itemInfo.zIndex,
        transitionDelay: `${multiDeleteDelay || 100}ms`,
      }}
      onContextMenu={handleContextMenu}
    >
      {isRoot && (
        <svg
          className={cx('root-item')}
          style={{ color: '#f3da35' }}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 256 256"
        >
          <rect width="256" height="256" fill="none"></rect>
          <path
            d="M45.1,196a8.1,8.1,0,0,0,10,5.9,273,273,0,0,1,145.7,0,8.1,8.1,0,0,0,10-5.9L236.3,87.7a8,8,0,0,0-11-9.2L174.7,101a8.1,8.1,0,0,1-10.3-3.4L135,44.6a8,8,0,0,0-14,0l-29.4,53A8.1,8.1,0,0,1,81.3,101L30.7,78.5a8,8,0,0,0-11,9.2Z"
            fill="#f3da35"
            stroke="#f3da35"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="12"
          ></path>
        </svg>
      )}

      {itemInfo.elType === ChartItemType.group && (
        <svg className={cx('root-item')} xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24">
          <g
            fill="#4cb3fa"
            fillRule="nonzero"
            stroke="none"
            strokeWidth="1"
            strokeLinecap="butt"
            strokeLinejoin="miter"
            strokeMiterlimit="10"
          >
            <g>
              <path d="M20,6h-8l-1.414,-1.414c-0.375,-0.375 -0.884,-0.586 -1.414,-0.586h-5.172c-1.1,0 -2,0.9 -2,2v12c0,1.1 0.9,2 2,2h16c1.1,0 2,-0.9 2,-2v-10c0,-1.1 -0.9,-2 -2,-2z"></path>
            </g>
          </g>
        </svg>
      )}
      {!isRoot && (
        <button className={cx('delete-button')} onClick={handleDeleteItem}>
          <i className="material-symbols-outlined">close</i>
        </button>
      )}

      <div
        className={cx('item-header', getBlockType(itemInfo.elType, true), {
          group: itemInfo.elType === ChartItemType.group,
        })}
      >
        <div
          className={cx('drag-handle')}
          style={{ height: BLOCK_HEADER_SIZE }}
          onMouseDown={(_event) => handleItemMoveStart(_event.nativeEvent, itemInfo)}
        >
          <i className="material-symbols-outlined">drag_indicator</i>
        </div>

        {itemInfo.elType !== ChartItemType.note && (
          <input
            type="text"
            readOnly={isReadyOnly}
            style={{
              height: BLOCK_HEADER_SIZE,
            }}
            onClick={() => {
              setIsReadOnly(false);
            }}
            onKeyDown={handleCancelInsert}
            onChange={handleTitleInput}
            onBlur={(_event) => {
              setIsReadOnly(true);
              setIsTyping(false);

              emitText(_event.target.value);
            }}
            value={selectedName}
            maxLength={15}
          />
        )}
      </div>

      {itemInfo.elType !== ChartItemType.note && (
        <div
          className={cx('point-list-wrap')}
          style={{
            minHeight:
              Math.max(
                (itemInfo.connectionIds?.right || []).length,
                Math.max((itemInfo.connectionIds?.left || []).length, 0)
              ) *
              (CONNECT_POINT_GAP + CONNECT_POINT_SIZE),
            paddingLeft: POINT_LIST_PADDING,
            paddingRight: POINT_LIST_PADDING,
            paddingTop: CONNECT_POINT_START,
          }}
        >
          {connectPointList}
        </div>
      )}

      <PropertiesEditBlock chartItem={itemInfo} handlePointConnectStart={handlePointConnectStart} />
    </div>
  );
}

export default ChartItem;

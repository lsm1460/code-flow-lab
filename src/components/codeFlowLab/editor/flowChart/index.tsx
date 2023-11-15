import { REQUEST_COPY, REQUEST_CUT, REQUEST_PASTE, SEND_COPY_OBJECTS } from '@/consts/channel.js';
import { CHART_SCRIPT_ITEMS, CONNECT_POINT_CLASS } from '@/consts/codeFlowLab/items';
import { ChartItemType, ChartItems, ConnectPoint, PointPos } from '@/consts/types/codeFlowLab';
import { RootState } from '@/reducers';
import { Operation, setDeleteTargetIdListAction, setDocumentValueAction } from '@/reducers/contentWizard/mainDocument';
import { getChartItem, getRandomId, getSceneId } from '@/utils/content';
import classNames from 'classnames/bind';
import _ from 'lodash';
import { MouseEventHandler, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { ConnectPoints, MoveItems } from '..';
import ChartItem from './chartItem';
import styles from './flowChart.module.scss';
import { doPolygonsIntersect, getBlockType, getCanvasLineColor, getNewPos, getRectPoints } from './utils';
const cx = classNames.bind(styles);

type PathInfo = { pos: string; prev: string; prevList: string[] };

interface Props {
  moveItems: MoveItems;
  connectPoints: ConnectPoints;
  scale?: number;
  transX?: number;
  transY?: number;
}
function FlowChart({ scale, transX, transY, moveItems, connectPoints }: Props) {
  const { ipcRenderer } = window.electron;

  const dispatch = useDispatch();

  const flowChartRef = useRef<HTMLDivElement>(null);
  const chartItemWrapRef = useRef<HTMLDivElement>(null);
  const lineCanvasRef = useRef<HTMLCanvasElement>(null);
  const connectedCanvasRef = useRef<HTMLCanvasElement>(null);
  const scrollTransRef = useRef({ x: 0, y: 0 });

  const selectedItemId = useRef<string>(null);
  const multiSelectedIdListClone = useRef<string[]>([]);
  const totalDelta = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const selectedConnectionPoint = useRef<PointPos>(null);
  const disconnectionPoint = useRef<PointPos>(null);
  const multiSelectBoxStartPos = useRef<[number, number]>(null);
  const multiSelectBoxEndPos = useRef<[number, number]>(null);

  const { selectedSceneId, chartItems, sceneItemIds, itemsPos } = useSelector((state: RootState) => {
    const selectedSceneId = getSceneId(state.contentDocument.scene, state.sceneOrder);
    return {
      selectedSceneId,
      chartItems: state.contentDocument.items,
      itemsPos: state.contentDocument.itemsPos,
      sceneItemIds: state.contentDocument.scene[selectedSceneId]?.itemIds || [],
    };
  }, shallowEqual);

  const selectedChartItem = useMemo(() => getChartItem(sceneItemIds, chartItems), [chartItems, sceneItemIds, itemsPos]);

  const [windowSize, setWindowSize] = useState(0);
  const [lineCanvasCtx, setLineCanvasCtx] = useState<CanvasRenderingContext2D>(null);
  const [connectedCanvasCtx, setConnectedCanvasCtx] = useState<CanvasRenderingContext2D>(null);
  const [multiSelectedItemList, setMultiSelectedItemList] = useState<{ [_itemId: string]: { x: number; y: number } }>(
    {}
  );
  const [itemMoveDelta, setItemMoveDelta] = useState({ x: 0, y: 0 });
  const [pointMove, setPointMove] = useState(null);
  const [isClearCanvasTrigger, setIsClearCanvasTrigger] = useState(false);
  const [connectedPointList, setConnectedPointList] = useState([]);

  const convertClientPosToLocalPos = (_clientPos: { x: number; y: number }) => {
    if (!flowChartRef.current) {
      return { x: 0, y: 0 };
    }

    const { left, top } = flowChartRef.current.getBoundingClientRect();

    return { x: (_clientPos.x - left) / scale, y: (_clientPos.y - top) / scale };
  };

  const makePointPosByEl = (_el: HTMLElement): PointPos => {
    if (!_el) {
      return;
    }

    if (!_el.classList.contains(CONNECT_POINT_CLASS)) {
      return;
    }

    const { x: _transX, y: _transY } = scrollTransRef.current;

    const { width, left, top } = _el.getBoundingClientRect();

    const { x: convertedX, y: convertedY } = convertClientPosToLocalPos({ x: left + width / 2, y: top + width / 2 });

    return {
      el: _el,
      parentId: _el.dataset.parentId,
      left: convertedX - _transX,
      top: convertedY - _transY,
      index: parseInt(_el.dataset.index, 10),
      typeIndex: parseInt(_el.dataset.typeIndex, 10),
      connectDir: _el.dataset.connectDir as 'left' | 'right',
      connectType: _el.dataset.connectType as ChartItemType,
      isSlave: _el.dataset.isSlave ? true : false,
    };
  };

  const orderedChartItems = useMemo(() => {
    const selectedIdList = selectedItemId.current ? Object.keys(multiSelectedItemList) : [];
    const adjustedMovePosItems = _.mapValues(selectedChartItem, (_v, _kId) => ({
      ..._v,
      pos: {
        ...itemsPos[_v.id][selectedSceneId],
        ...(selectedIdList.includes(_kId) && {
          left: multiSelectedItemList[_kId].x,
          top: multiSelectedItemList[_kId].y,
        }),
      },
    }));

    return Object.values(adjustedMovePosItems);
  }, [selectedChartItem, scale, multiSelectedItemList, selectedItemId, itemsPos]);

  useEffect(() => {
    const triggerResizeCanvas = _.debounce(() => {
      setWindowSize(window.innerWidth);
    }, 100);

    window.addEventListener('resize', triggerResizeCanvas);

    return () => {
      window.removeEventListener('resize', triggerResizeCanvas);
    };
  }, []);

  useEffect(() => {
    const connected = [],
      result = [];

    const pointList = document.querySelectorAll(`.${CONNECT_POINT_CLASS}[data-connect-parent-id]`);

    for (let _i = 0; _i < pointList.length; _i++) {
      const pointEl = pointList[_i] as HTMLElement;

      const connedtedIds = [pointEl.dataset.parentId, pointEl.dataset.connectParentId].sort().join('-');

      if (connected.includes(connedtedIds)) {
        continue;
      } else {
        connected.push(connedtedIds);

        const connectedEl = document.querySelector(
          `[data-parent-id=${pointEl.dataset.connectParentId}][data-connect-parent-id=${pointEl.dataset.parentId}]`
        ) as HTMLElement;
        result.push([makePointPosByEl(pointEl), makePointPosByEl(connectedEl)]);
      }
    }

    setConnectedPointList(result);
  }, [orderedChartItems]);

  useEffect(() => {
    scrollTransRef.current = {
      x: transX,
      y: transY,
    };
  }, [transX, transY]);

  useEffect(() => {
    if (lineCanvasRef.current && connectedCanvasRef.current) {
      const lineCanvas = lineCanvasRef.current;
      const connectedCanvas = connectedCanvasRef.current;

      lineCanvas.width = lineCanvas.parentElement.clientWidth;
      lineCanvas.height = lineCanvas.parentElement.clientHeight;
      connectedCanvas.width = connectedCanvas.parentElement.clientWidth;
      connectedCanvas.height = connectedCanvas.parentElement.clientHeight;
    }
  }, [lineCanvasRef, connectedCanvasRef, windowSize]);

  useEffect(() => {
    if (lineCanvasRef.current && connectedCanvasRef.current) {
      const lineCanvas = lineCanvasRef.current;
      const connectedCanvas = connectedCanvasRef.current;

      const lineCtx = lineCanvas.getContext('2d');
      const connectedCtx = connectedCanvas.getContext('2d');

      setLineCanvasCtx(lineCtx);
      setConnectedCanvasCtx(connectedCtx);
    }
  }, [lineCanvasRef, connectedCanvasRef]);

  useEffect(() => {
    if (lineCanvasCtx && isClearCanvasTrigger) {
      lineCanvasCtx.clearRect(0, 0, lineCanvasRef.current.width, lineCanvasRef.current.height);

      setIsClearCanvasTrigger(false);
    }
  }, [lineCanvasCtx, isClearCanvasTrigger]);

  useEffect(() => {
    if (connectedCanvasCtx) {
      connectedCanvasCtx.clearRect(0, 0, connectedCanvasRef.current.width, connectedCanvasRef.current.height);

      connectedPointList.forEach((_points) => {
        drawConnectionPointLine('connected', connectedCanvasCtx, _points[0], _points[1]);
      });
    }
  }, [connectedCanvasCtx, connectedPointList, transX, transY]);

  useEffect(() => {
    multiSelectedIdListClone.current = Object.keys(multiSelectedItemList);

    window.addEventListener('keydown', deleteItems);

    return () => {
      window.removeEventListener('keydown', deleteItems);
    };
  }, [multiSelectedItemList]);

  useEffect(() => {
    // cut, copy
    const handleRequestCopy = () => {
      ipcRenderer.send(SEND_COPY_OBJECTS, {
        items: _.pickBy(
          selectedChartItem,
          (_item) => multiSelectedIdListClone.current.includes(_item.id) && _item.elType !== ChartItemType.body
        ),
        pos: _.mapValues(
          _.pickBy(itemsPos, (_pos, _itemId) => multiSelectedIdListClone.current.includes(_itemId)),
          (_pos) => _pos[selectedSceneId]
        ),
      });
    };

    const handleRequestCut = () => {
      handleRequestCopy();

      deleteItems(null, multiSelectedIdListClone.current);
    };

    ipcRenderer.on(REQUEST_CUT, handleRequestCut);
    ipcRenderer.on(REQUEST_COPY, handleRequestCopy);

    return () => {
      ipcRenderer.removeAllListeners(REQUEST_CUT);
      ipcRenderer.removeAllListeners(REQUEST_COPY);
    };
  }, [selectedChartItem, selectedSceneId]);

  useEffect(() => {
    // paste
    const handleRequestPaste = (e, { items, pos }) => {
      const sceneItemSize = Object.keys(getChartItem(sceneItemIds, chartItems)).length;

      const copiedIdList = Object.keys(items);
      const changedIds = _.mapValues(_.mapKeys(copiedIdList), () => getRandomId());

      const operations = Object.values(items).reduce<Operation[]>(
        (_acc, _cur: ChartItems, _index) => {
          const newItemId = changedIds[_cur.id];

          let _val;

          return _acc.map((_op) => {
            if (_op.key === 'items') {
              let connectionIds = _.mapValues(_cur.connectionIds, (_pointList, _dir) =>
                _pointList
                  .map(
                    (_point) =>
                      changedIds[_point.connectParentId] && {
                        ..._point,
                        parentId: newItemId,
                        connectParentId: changedIds[_point.connectParentId],
                      }
                  )
                  .filter((_point) => _point)
              );

              _val = {
                ..._op.value,
                [newItemId]: {
                  ..._cur,
                  id: newItemId,
                  connectionIds,
                  zIndex: sceneItemSize + _index + 1,
                  ...(_cur.connectionVariables && {
                    connectionVariables: _cur.connectionVariables
                      .map(
                        (_point) =>
                          changedIds[_point.connectParentId] && {
                            ..._point,
                            parentId: newItemId,
                            connectParentId: changedIds[_point.connectParentId],
                          }
                      )
                      .filter((_point) => _point),
                  }),
                },
              };
            } else if (_op.key === 'itemsPos') {
              _val = {
                ..._op.value,
                [newItemId]: {
                  [selectedSceneId]: getNewPos(itemsPos, selectedSceneId, pos[_cur.id]),
                },
              };
            } else {
              _val = [..._op.value, newItemId];
            }

            return { ..._op, value: _val };
          });
        },
        [
          {
            key: 'items',
            value: {
              ...chartItems,
            },
          },
          {
            key: `itemsPos`,
            value: {
              ...itemsPos,
            },
          },
          {
            key: `scene.${selectedSceneId}.itemIds`,
            value: [...sceneItemIds],
          },
        ]
      );

      dispatch(setDocumentValueAction(operations));
    };

    ipcRenderer.on(REQUEST_PASTE, handleRequestPaste);
    return () => {
      ipcRenderer.removeAllListeners(REQUEST_PASTE);
    };
  }, [chartItems, itemsPos, selectedSceneId]);

  useEffect(() => {
    if (selectedItemId.current) {
      totalDelta.current = {
        x: totalDelta.current.x + itemMoveDelta.x / scale,
        y: totalDelta.current.y + itemMoveDelta.y / scale,
      };

      setMultiSelectedItemList((_prev) =>
        _.mapValues(_prev, (_pos) => ({ x: _pos.x + itemMoveDelta.x / scale, y: _pos.y + itemMoveDelta.y / scale }))
      );
    }
  }, [itemMoveDelta, selectedItemId, scale]);

  useEffect(() => {
    if (selectedConnectionPoint.current && pointMove) {
      const { x: _transX, y: _transY } = scrollTransRef.current;
      const { x: convertedX, y: convertedY } = convertClientPosToLocalPos(pointMove);
      const _targetPoint = {
        ...selectedConnectionPoint.current,
        left: convertedX - _transX,
        top: convertedY - _transY,
      };
      selectedConnectionPoint.current = _targetPoint;

      lineCanvasCtx.clearRect(0, 0, lineCanvasRef.current.width, lineCanvasRef.current.height);

      const originPoint = makePointPosByEl(selectedConnectionPoint.current.el);

      let connectedPoint;

      if (pointMove.el) {
        const targetPoint = makePointPosByEl(pointMove.el);

        const isAbleConnect = checkConnectable(selectedConnectionPoint.current.el, targetPoint.el);
        if (isAbleConnect) {
          connectedPoint = targetPoint;
        }
      }

      drawConnectionPointLine('line', lineCanvasCtx, originPoint, connectedPoint);
    }
  }, [pointMove, selectedConnectionPoint, lineCanvasCtx, lineCanvasRef, selectedChartItem, scale]);

  const deleteItems = (_event: KeyboardEvent, _targetIdList: string[] = null) => {
    if (_event?.code === 'Delete' || _targetIdList) {
      _targetIdList = _targetIdList || Object.keys(multiSelectedItemList);

      const deleteTargetIdList = _targetIdList.filter(
        (_itemId) => selectedChartItem[_itemId].elType !== ChartItemType.body
      );

      if (deleteTargetIdList.length < 1) {
        return;
      }

      dispatch(setDeleteTargetIdListAction(deleteTargetIdList));
    }
  };

  const drawConnectionPointLine = (
    _type: 'line' | 'connected',
    _ctx: CanvasRenderingContext2D,
    _origin: PointPos,
    _next?: PointPos
  ) => {
    const isSkip =
      disconnectionPoint.current &&
      _type === 'connected' &&
      ((_origin.el === disconnectionPoint.current.el && _origin.typeIndex === disconnectionPoint.current.typeIndex) ||
        (_next?.el === disconnectionPoint.current.el && _next?.typeIndex === disconnectionPoint.current.typeIndex));

    if (!isSkip) {
      _ctx.beginPath();
      _ctx.moveTo(_origin.left + transX, _origin.top + transY);
    }

    _ctx.strokeStyle = '#ff0000';

    if (_next && _next.el !== _origin.el) {
      _ctx.strokeStyle = getCanvasLineColor(_origin.connectType, _next.connectType);

      _ctx.lineTo(_next.left + transX, _next.top + transY);
    } else if (_type === 'line' && selectedConnectionPoint.current) {
      _ctx.lineTo(selectedConnectionPoint.current.left + transX, selectedConnectionPoint.current.top + transY);
    }

    if (!isSkip) {
      _ctx.stroke();
    }
  };

  const checkLoopConnection = (_startId, _targetId, _connectDir) => {
    const visitedList = [];
    const visited: { [_pathKey: string]: PathInfo } = {};

    let needVisit: PathInfo[] = [],
      isLoop = false;

    needVisit.push({ pos: _startId, prev: null, prevList: [] });

    while (needVisit.length > 0) {
      const path = needVisit.shift();
      const _pathKey = path.pos;

      if (_startId === _targetId || _targetId === _pathKey) {
        isLoop = true;
        visited[_pathKey] = path;
        break;
      }

      if (!visitedList.includes(_pathKey)) {
        if (!needVisit.map((_need) => _need.pos).includes(_pathKey)) {
          // 대기열에 남아있을 경우 탐색을 끝내지 않음 (같은 칸 이여도 탐색 히스토리가 다를 수 있음)
          visited[_pathKey] = path;
          visitedList.push(_pathKey);
        }

        const searchIdList = [
          ...(selectedChartItem[_pathKey].connectionIds[_connectDir] || []),
          ..._.compact(selectedChartItem[_pathKey]?.connectionVariables || []),
        ];

        const targetPos = searchIdList.map((_node) => ({
          pos: _node.connectParentId,
          prev: _pathKey,
          prevList: [...path.prevList, path.pos],
        }));

        needVisit = [...needVisit, ...targetPos];
      }
    }

    return isLoop;
  };

  const checkConnectable = (_originEl: HTMLElement, _targetEl: HTMLElement): boolean => {
    if (!(_originEl.classList.contains(CONNECT_POINT_CLASS) && _targetEl.classList.contains(CONNECT_POINT_CLASS))) {
      // 아이디 유무확인
      return false;
    }

    const {
      parentId: originParentId,
      connectDir: originConnectDir,
      connectType: originConnectType,
    } = _originEl.dataset;

    const {
      parentId: targetParentId,
      connectDir: targetConnectDir,
      connectType: targetConnectType,
    } = _targetEl.dataset;

    // 이미 연결된 점 확인
    const connectedIdList = selectedChartItem[originParentId].connectionIds[originConnectDir as 'left' | 'right'].map(
      (_point) => _point.connectParentId
    );

    if (connectedIdList.includes(targetParentId)) {
      return false;
    }

    // 이미 연결된 블럭 확인
    const isAlreadyConnected = !!_.find(
      selectedChartItem[originParentId].connectionIds[originConnectDir],
      (_pos: ConnectPoint) => _pos.connectParentId === targetParentId
    );
    if (isAlreadyConnected) {
      return false;
    }

    if (originConnectDir === targetConnectDir) {
      // 좌우 확인
      return false;
    }

    if (checkLoopConnection(targetParentId, originParentId, originConnectDir)) {
      // 루프 확인
      return false;
    }

    const _elType = selectedChartItem[originParentId].elType;
    const _targetType = selectedChartItem[targetParentId].elType;

    const isOnlyConnectToVariable =
      _.intersection([_elType, _targetType], [ChartItemType.changeValue, ChartItemType.input]).length > 0;

    if (isOnlyConnectToVariable) {
      // 변수 변경 블럭은 정말 변수만 연결되어야 한다.
      return (
        _.intersection([_elType, _targetType], [ChartItemType.input, ChartItemType.variable, ...CHART_SCRIPT_ITEMS])
          .length > 1
      );
    }

    const isTargetDeepCheck =
      _.intersection([_elType, _targetType], [ChartItemType.trigger, ChartItemType.function]).length > 1;

    const _convertedElType = getBlockType(_elType);
    const _convertedTargetElType = getBlockType(selectedChartItem[targetParentId].elType, isTargetDeepCheck);

    if (
      (originConnectType === ChartItemType.variable && targetConnectType === ChartItemType.variable) ||
      (originConnectType === ChartItemType.style && targetConnectType === ChartItemType.style)
    ) {
      return true;
    }

    // 시작점의 가능 타입과 타겟 블럭이 같고,
    // 연결점의 가능 타입과 시작 블럭의 타입이 같을 때
    return (
      getBlockType(originConnectType, isTargetDeepCheck) === _convertedTargetElType &&
      getBlockType(targetConnectType) === _convertedElType
    );
  };

  const getSelectedItemIds = () => {
    let _idList = [];

    if (chartItemWrapRef.current && multiSelectBoxStartPos.current) {
      const children = Array.from(chartItemWrapRef.current.children);

      let selectBox = [];

      if (multiSelectBoxEndPos.current) {
        selectBox = [
          { x: multiSelectBoxStartPos.current[0], y: multiSelectBoxStartPos.current[1] },
          { x: multiSelectBoxEndPos.current[0], y: multiSelectBoxStartPos.current[1] },
          { x: multiSelectBoxEndPos.current[0], y: multiSelectBoxEndPos.current[1] },
          { x: multiSelectBoxStartPos.current[0], y: multiSelectBoxEndPos.current[1] },
        ];
      } else {
        selectBox = [{ x: multiSelectBoxStartPos.current[0], y: multiSelectBoxStartPos.current[1] }];
      }

      children.forEach((_el) => {
        const _htmlEl = _el as HTMLElement;
        let points = getRectPoints(_htmlEl);
        points = points.map((_point) => convertClientPosToLocalPos(_point));

        const isOverlap = doPolygonsIntersect(points, selectBox);

        if (isOverlap) {
          _idList.push(_htmlEl.dataset.id);
        }
      });
    }

    if (!multiSelectBoxEndPos.current) {
      _idList = _idList.reduce((_acc, _itemId) => {
        const curZIndex = parseInt(document.querySelector<HTMLElement>(`[data-id=${_itemId}]`).style['z-index'] || '0');
        const accZIndex = _acc[0]
          ? parseInt(document.querySelector<HTMLElement>(`[data-id=${_acc[0]}]`).style['z-index'] || '0')
          : 0;

        if (accZIndex < curZIndex) {
          return [_itemId];
        } else {
          return _acc;
        }
      }, []);
    }

    return _idList;
  };

  const handleItemMoveStart = useCallback((_event: MouseEvent, _selectedItem: ChartItems) => {
    _event.stopPropagation();

    // TODO: z-index조정
    if (multiSelectedIdListClone.current.includes(_selectedItem.id)) {
      if (_event.ctrlKey) {
        // 다중 선택이 있을 때 컨트롤 키가 눌러져 있다면 그 아이템을 선택취소한다.
        setMultiSelectedItemList((_prev) => _.pickBy(_prev, (_v, _itemId) => _itemId !== _selectedItem.id));
      } else {
        // 다중 선택일 때 컨트롤 키가 눌러져 있지 않다면 그 아이템을 기준으로 움직인다.
        selectedItemId.current = _selectedItem.id;
      }
    } else {
      // 다중 선택된 아이템이 없을 때
      setMultiSelectedItemList((_prev) => {
        if (_event.ctrlKey) {
          // 컨트롤이 눌러져 있다면 아이템 추가
          return {
            ..._prev,
            [_selectedItem.id]: { x: _selectedItem.pos.left, y: _selectedItem.pos.top },
          };
        } else {
          // 다중 선택된 아이템이 없고 컨트롤도 없다면 하나의 아이템 추가
          return { [_selectedItem.id]: { x: _selectedItem.pos.left, y: _selectedItem.pos.top } };
        }
      });
      // 선택된 아이템을 기준으로 움직인다.
      selectedItemId.current = _selectedItem.id;
    }
    document.addEventListener('mousemove', handleMouseMoveItems);
    document.addEventListener('mouseup', handleMouseUpItems);
  }, []);

  const handlePointConnectStart: MouseEventHandler<HTMLSpanElement> = useCallback(
    (_event) => {
      if (_event.button !== 0) {
        return;
      }

      _event.stopPropagation();

      // 초기화
      selectedItemId.current = null;
      setMultiSelectedItemList({});

      const dotEl = _event.target as HTMLSpanElement;
      const selectedPoint = makePointPosByEl(dotEl);

      const _connect = dotEl.dataset.connectParentId;

      if (_connect) {
        // 이미 연결된 포인트를 분리시켜야 함
        const connectedEl = document.querySelector(
          `[data-parent-id=${dotEl.dataset.connectParentId}][data-connect-parent-id=${dotEl.dataset.parentId}]`
        ) as HTMLElement;

        selectedConnectionPoint.current = makePointPosByEl(connectedEl);
        disconnectionPoint.current = selectedPoint;

        setPointMove({ x: _event.clientX, y: _event.clientY });
      } else {
        selectedConnectionPoint.current = selectedPoint;
      }
      document.addEventListener('mousemove', handleMouseMovePoint);
      document.addEventListener('mouseup', handleMouseUpPoint);
    },
    [lineCanvasCtx, selectedChartItem]
  );

  const handleMouseDown: MouseEventHandler<HTMLDivElement> = (_event) => {
    if (_event.buttons === 1 && !selectedItemId.current && !selectedConnectionPoint.current) {
      // multi select.. only left click..

      const { x: convertedX, y: convertedY } = convertClientPosToLocalPos({ x: _event.clientX, y: _event.clientY });

      multiSelectBoxStartPos.current = [convertedX, convertedY];
      // multiSelectBoxEndPos.current = [convertedX, convertedY];

      document.addEventListener('mousemove', handleMouseMoveMultiSelect);
      document.addEventListener('mouseup', handleMouseUpMultiSelect);

      return;
    }
  };

  const handleMouseMoveItems = (_event: MouseEvent) => {
    if (selectedItemId.current) {
      setItemMoveDelta({ x: _event.movementX, y: _event.movementY });
    }
  };

  const handleMouseMovePoint = (_event: MouseEvent) => {
    if (selectedConnectionPoint.current) {
      const isPoint = (_event.target as HTMLElement).classList.contains(CONNECT_POINT_CLASS);

      setPointMove({ x: _event.clientX, y: _event.clientY, ...(isPoint && { el: _event.target }) });
    }
  };

  const getSelectItemPos = (_itemIdList) => {
    const _ids = _.mapKeys(_itemIdList, (_id) => _id);

    return _.mapValues(_ids, (__, _itemId) => ({
      x: itemsPos[_itemId][selectedSceneId].left,
      y: itemsPos[_itemId][selectedSceneId].top,
    }));
  };

  const handleMouseMoveMultiSelect = (_event: MouseEvent) => {
    if (multiSelectBoxStartPos) {
      const { x: convertedX, y: convertedY } = convertClientPosToLocalPos({ x: _event.clientX, y: _event.clientY });

      multiSelectBoxEndPos.current = [convertedX, convertedY];

      lineCanvasCtx.clearRect(0, 0, lineCanvasRef.current.width, lineCanvasRef.current.height);

      const _multiSelectEndPos = [
        multiSelectBoxEndPos.current[0] + _event.movementX / scale,
        multiSelectBoxEndPos.current[1] + _event.movementY / scale,
      ] as [number, number];

      multiSelectBoxEndPos.current = _multiSelectEndPos;

      const selectedIds = getSelectedItemIds();
      const selectedItemPos = getSelectItemPos(selectedIds);
      setMultiSelectedItemList((_prev) => (_.isEqual(_prev, selectedItemPos) ? _prev : selectedItemPos));

      lineCanvasCtx.beginPath();

      lineCanvasCtx.save();

      lineCanvasCtx.fillStyle = 'red';
      lineCanvasCtx.globalAlpha = 0.2;

      const _endPos = _multiSelectEndPos.map((_p, _i) => _p - multiSelectBoxStartPos.current[_i]) as [number, number];

      lineCanvasCtx.fillRect(...multiSelectBoxStartPos.current, ..._endPos);

      lineCanvasCtx.restore();
    }
  };

  const handleMouseUpItems = () => {
    moveItems(multiSelectedIdListClone.current, totalDelta.current.x, totalDelta.current.y);

    // 관련 값 초기화
    selectedItemId.current = null;
    totalDelta.current = { x: 0, y: 0 };
    // multiSelectedIdListClone.current = [];

    document.removeEventListener('mousemove', handleMouseMoveItems);
    document.removeEventListener('mouseup', handleMouseUpItems);
  };

  const handleMouseUpPoint = (_event) => {
    setIsClearCanvasTrigger(true);
    setPointMove(null);

    document.removeEventListener('mousemove', handleMouseMovePoint);
    document.removeEventListener('mouseup', handleMouseUpPoint);

    const _upEl = _event.target as HTMLElement;

    if (selectedConnectionPoint.current) {
      const { x: _transX, y: _transY } = scrollTransRef.current;

      const _connected = checkConnectable(selectedConnectionPoint.current.el, _upEl);

      let connectPoint: PointPos;

      if (_connected) {
        connectPoint = makePointPosByEl(_upEl);
      }

      if (disconnectionPoint.current && _connected) {
        // change
        connectPoints(selectedConnectionPoint.current, connectPoint, disconnectionPoint.current);
      } else if (disconnectionPoint.current && !_connected) {
        // disconnect
        connectPoints(selectedConnectionPoint.current, connectPoint, disconnectionPoint.current);
      } else if (!disconnectionPoint.current && _connected) {
        // connect
        connectPoints(selectedConnectionPoint.current, connectPoint);
      }

      selectedConnectionPoint.current = null;
    }

    disconnectionPoint.current = null;
  };

  const handleMouseUpMultiSelect = (_event: MouseEvent) => {
    lineCanvasCtx.clearRect(0, 0, lineCanvasRef.current.width, lineCanvasRef.current.height);
    const selectedIds = getSelectedItemIds();
    const selectedItemPos = getSelectItemPos(selectedIds);

    setMultiSelectedItemList((_prev) => (_.isEqual(_prev, selectedItemPos) ? _prev : selectedItemPos));

    multiSelectBoxStartPos.current = null;
    multiSelectBoxEndPos.current = null;

    document.removeEventListener('mousemove', handleMouseMoveMultiSelect);
    document.removeEventListener('mouseup', handleMouseUpMultiSelect);
  };

  return (
    <div
      ref={flowChartRef}
      className={cx('canvas-wrap')}
      onMouseDown={handleMouseDown}
      style={{
        width: `${100 / scale}%`,
        height: `${100 / scale}%`,
        left: `calc(50% - ${transX}px)`,
        top: `calc(50% - ${transY}px)`,
      }}
    >
      <canvas ref={connectedCanvasRef} className={cx('connection-flow-chart')} />

      <div
        ref={chartItemWrapRef}
        style={{
          left: transX,
          top: transY,
        }}
      >
        {orderedChartItems.map((_itemInfo, _i) => (
          <ChartItem
            key={_itemInfo.id}
            chartItems={selectedChartItem}
            itemInfo={_itemInfo}
            isSelected={Object.keys(multiSelectedItemList).includes(_itemInfo.id)}
            handleItemMoveStart={handleItemMoveStart}
            handlePointConnectStart={handlePointConnectStart}
          />
        ))}
      </div>

      <canvas ref={lineCanvasRef} className={cx('connection-flow-chart', 'layer-top')} />
    </div>
  );
}

export default FlowChart;

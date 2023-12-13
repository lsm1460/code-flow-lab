import {
  REQUEST_CHANGE_ROOT,
  REQUEST_EDIT_GROUP,
  REQUEST_MAKE_GROUP,
  REQUEST_UNGROUP,
  REQUEST_ADD_MEMO,
  REQUEST_DELETE,
} from '@/consts/channel.js';
import {
  CHART_ELEMENT_ITEMS,
  CHART_SCRIPT_ITEMS,
  CHART_TEXT_ITEMS,
  CONNECT_POINT_CLASS,
  ZOOM_AREA_ELEMENT_ID,
} from '@/consts/codeFlowLab/items';
import { ChartGroupItem, ChartItemType, ChartItems, ConnectPoint, PointPos } from '@/consts/types/codeFlowLab';
import { RootState } from '@/reducers';
import {
  Operation,
  setDeleteTargetIdListAction,
  setDocumentValueAction,
  setOpenedGroupIdListAction,
  setSelectedGroupIdAction,
} from '@/reducers/contentWizard/mainDocument';
import { getChartItem, getGroupItemIdList, getRandomId, getSceneId, makePasteOperations } from '@/utils/content';
import classNames from 'classnames/bind';
import CryptoJS from 'crypto-js';
import _ from 'lodash';
import { MouseEventHandler, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { ConnectPoints, MoveItems } from '..';
import ChartItem from './chartItem';
import styles from './flowChart.module.scss';
import { doPolygonsIntersect, getBlockType, getCanvasLineColor, getRectPoints, makeNewItem } from './utils';
import useIpcManager from '../../useIpcManager';

const PRIVATE_KEY = 'codeflowlabcopypastekey';
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

  const { sendContextOpen } = useIpcManager(false);

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

  const {
    selectedGroupId,
    openedGroupIdList,
    group,
    selectedSceneId,
    deleteTargetIdList,
    chartItems,
    flowScene,
    sceneItemIds,
    itemsPos,
  } = useSelector((state: RootState) => {
    const selectedSceneId = getSceneId(state.contentDocument.scene, state.sceneOrder, state.selectedGroupId);

    return {
      selectedGroupId: state.selectedGroupId,
      openedGroupIdList: state.openedGroupIdList,
      selectedSceneId,
      deleteTargetIdList: state.deleteTargetIdList,
      chartItems: state.contentDocument.items,
      itemsPos: state.contentDocument.itemsPos,
      flowScene: state.contentDocument.scene,
      sceneItemIds: state.contentDocument.scene[selectedSceneId]?.itemIds,
      group: state.contentDocument.group,
    };
  }, shallowEqual);

  const selectedChartItem = useMemo(
    () => getChartItem(sceneItemIds, chartItems, selectedGroupId, group),
    [chartItems, sceneItemIds, itemsPos, selectedGroupId, group]
  );

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

      connectedPointList
        .filter(
          (_pointList) =>
            !deleteTargetIdList.includes(_pointList[0].parentId) || !deleteTargetIdList.includes(_pointList[1].parentId)
        )
        .forEach((_points) => {
          drawConnectionPointLine('connected', connectedCanvasCtx, _points[0], _points[1]);
        });
    }
  }, [connectedCanvasCtx, deleteTargetIdList, connectedPointList, transX, transY]);

  useEffect(() => {
    multiSelectedIdListClone.current = Object.keys(multiSelectedItemList);

    window.addEventListener('keydown', deleteItems);

    return () => {
      window.removeEventListener('keydown', deleteItems);
    };
  }, [multiSelectedItemList]);

  useEffect(() => {
    // cut, copy
    const handleRequestCopy = (_event: ClipboardEvent) => {
      if (document.activeElement.tagName === 'BODY' && multiSelectedIdListClone.current.length > 0) {
        _event.preventDefault();

        const idList = getGroupItemIdList(group, multiSelectedIdListClone.current);

        navigator.clipboard.writeText(
          CryptoJS.AES.encrypt(
            JSON.stringify({
              items: _.pickBy(chartItems, (_item) => idList.includes(_item.id) && _item.elType !== ChartItemType.body),
              pos: _.pickBy(itemsPos, (_pos, _itemId) => idList.includes(_itemId)),
              group: _.pickBy(group, (_idList, _groupId) => idList.includes(_groupId)),
              'copy-by': 'code-flow-lab',
            }),
            PRIVATE_KEY
          ).toString()
        );
      }
    };

    const handleRequestCut = (_event) => {
      handleRequestCopy(_event);

      deleteItems(null, multiSelectedIdListClone.current);
    };

    document.addEventListener('cut', handleRequestCut);
    document.addEventListener('copy', handleRequestCopy);

    return () => {
      document.removeEventListener('cut', handleRequestCut);
      document.removeEventListener('copy', handleRequestCopy);
    };
  }, [chartItems, group]);

  useEffect(() => {
    // paste
    const handleRequestPaste = async (_event) => {
      if (document.activeElement.tagName !== 'BODY') {
        return;
      }

      let clipText = await navigator.clipboard.readText();

      clipText = CryptoJS.AES.decrypt(clipText, PRIVATE_KEY).toString(CryptoJS.enc.Utf8);

      try {
        const objects = JSON.parse(clipText);

        if (objects['copy-by'] !== 'code-flow-lab') {
          throw new Error('not code flow lab objects');
        }

        _event.preventDefault();

        delete objects['copy-by'];

        const { items, pos, group: copiedGroup } = objects;

        const operations = makePasteOperations(
          chartItems,
          itemsPos,
          group,
          items,
          pos,
          copiedGroup,
          selectedGroupId,
          selectedSceneId,
          sceneItemIds
        );

        dispatch(setDocumentValueAction(operations));
      } catch (e) {}
    };

    document.addEventListener('paste', handleRequestPaste);

    return () => {
      document.removeEventListener('paste', handleRequestPaste);
    };
  }, [chartItems, itemsPos, selectedSceneId, selectedGroupId, group]);

  useEffect(() => {
    // group, ungroup
    const handleRequestMakeGroup = () => {
      const selectedId = multiSelectedIdListClone.current;

      if (selectedId.length < 2) {
        return;
      }

      // make group block, move block to group section, remove block in items and item pos
      const zoomArea = document.getElementById(ZOOM_AREA_ELEMENT_ID);
      const _items = selectedGroupId
        ? _.pickBy(chartItems, (_item, _itemId) => group[selectedGroupId].includes(_itemId))
        : chartItems;

      const [newFlowItem, pos, newItemId] = makeNewItem(
        zoomArea,
        _items,
        selectedChartItem,
        itemsPos,
        ChartItemType.group,
        selectedSceneId
      );

      let hasElementFlag = false;

      for (let _id of selectedId) {
        // body는 포함될 수 없음
        if (_items[_id].elType === ChartItemType.body) {
          return;
        } else if ((chartItems[selectedGroupId] as ChartGroupItem)?.rootId === _id) {
          return;
        } else if (CHART_ELEMENT_ITEMS.includes(chartItems[_id].elType) && !hasElementFlag) {
          hasElementFlag = true;
        }
      }

      if (!hasElementFlag) {
        return;
      }

      const _rootCandidate = selectedId.reduce((_acc, _cur) => {
        if (!CHART_ELEMENT_ITEMS.includes(chartItems[_cur].elType)) {
          return _acc;
        }

        // 외부와 연결이 있는 블럭
        const isConnectOutsideFlag =
          (_items[_cur].connectionIds.left || [])
            .map((_point) => _point.connectParentId)
            .filter((_itemId) => !selectedId.includes(_itemId)).length > 0;

        if (_items[_cur].connectionIds.left.length === 0 || isConnectOutsideFlag) {
          return [..._acc, _cur];
        } else {
          return _acc;
        }
      }, []);

      if (
        !_rootCandidate[0] ||
        [ChartItemType.body, ChartItemType.span, ChartItemType.listEl].includes(_items[_rootCandidate[0]].elType)
      ) {
        // 제외대상 설정
        return;
      }

      // group을 만들 때, 하위 그룹도 지원하기 위해서는 그룹 변경 명령을 먼저 보내야 함!!
      const operations: Operation[] = [
        {
          key: `group`,
          value: {
            ..._.mapValues(group, (_itemIdList, _groupId) => {
              if (_groupId === selectedGroupId) {
                return [newItemId, ..._itemIdList].filter((_itemId) => !selectedId.includes(_itemId));
              }

              return _itemIdList;
            }),
            [newItemId]: selectedId,
          },
        },
        {
          key: 'items',
          value: {
            ..._.mapValues(chartItems, (_item, _itemId) => {
              if (!selectedId.includes(_itemId)) {
                return {
                  ..._item,
                  connectionIds: _.mapValues(_item.connectionIds, (_pointlist, _dir) =>
                    _pointlist
                      .map((_point) => {
                        if (_rootCandidate[0] && _rootCandidate[0] === _point.connectParentId) {
                          return {
                            ..._point,
                            connectParentId: newItemId,
                          };
                        }

                        return _point;
                      })
                      .filter((_point) => !selectedId.includes(_point.connectParentId))
                  ),
                  ...(_item.connectionVariables && {
                    connectionVariables: _item.connectionVariables.filter(
                      (_point) => !selectedId.includes(_point.connectParentId)
                    ),
                  }),
                };
              } else {
                return {
                  ..._item,
                  connectionIds: _.mapValues(_item.connectionIds, (_connectPoint, _dir) =>
                    _connectPoint.filter((_point) => selectedId.includes(_point.connectParentId))
                  ),
                  ...(_item.connectionVariables && {
                    connectionVariables: _item.connectionVariables.filter((_point) =>
                      selectedId.includes(_point.connectParentId)
                    ),
                  }),
                };
              }
            }),
            [newItemId]: {
              ...newFlowItem,
              rootId: _rootCandidate[0],
              ...(_rootCandidate[0] && {
                connectionIds: {
                  left: (_items[_rootCandidate[0]].connectionIds.left || []).map((_point) => ({
                    ..._point,
                    parentId: newItemId,
                  })),
                },
              }),
            },
          },
        },
        {
          key: `itemsPos`,
          value: {
            ..._.mapValues(itemsPos, (_itemPos, _itemId) => {
              if (selectedId.includes(_itemId)) {
                return { ..._itemPos, [newItemId]: _itemPos[selectedSceneId] };
              }

              return _itemPos;
            }),
            [newItemId]: _rootCandidate[0] ? itemsPos[_rootCandidate[0]] : pos,
          },
        },
      ];

      if (!selectedGroupId) {
        operations.push({
          key: `scene.${selectedSceneId}.itemIds`,
          value: [...sceneItemIds.filter((_itemId) => !selectedId.includes(_itemId)), newItemId],
        });
      }

      dispatch(setDocumentValueAction(operations));
    };

    const handleRequestUngroup = (_e, _groupId) => {
      let count = Object.values(flowScene).reduce((_acc, _cur) => {
        if (_cur.itemIds.includes(_groupId)) {
          return _acc + 1;
        }

        return _acc;
      }, 0);

      count = _.reduce(
        group,
        (_acc, _cur, _key) => {
          if (_cur.includes(_groupId)) {
            return _acc + 1;
          } else {
            return _acc;
          }
        },
        count
      );

      const groupedItemIdList = group[_groupId];
      const { rootId, connectionIds } = chartItems[_groupId] as ChartGroupItem;
      const connectedIdList = Object.values(connectionIds).reduce(
        (_acc, _cur) => [..._acc, ..._cur.map((_point) => _point.connectParentId)],
        []
      );

      let operations: Operation[] = [];

      if (count > 1) {
        // 기존에 그릅에 있는 아이템들을 새로 만들어서 현재장면에 붙여넣어야함!
        const newIds = groupedItemIdList.reduce((_acc, _cur) => ({ ..._acc, [_cur]: getRandomId() }), {});

        // 1. group에서 groupId와 일치하는 그룹을 제거해야함 + 새로 붙여넣어야 하는 아이템 아이디 리스트를 집어넣어야함
        operations.push({
          key: 'group',
          value: _.mapValues(group, (_itemIdList, __groupId) => {
            if (__groupId === selectedGroupId) {
              return [..._itemIdList, ...Object.values(newIds)].filter((_id) => _id !== _groupId);
            }

            return _itemIdList;
          }),
        });

        // 2. group[_groupId]의 아이템 아이디 리스트를 가져와 chartItems과 엮어 새로운 아이템을 추가해야함. 그룹 내 그룹이 있는 경우 딥카피해서 만들 필요 없음
        operations.push({
          key: 'items',
          value: {
            ..._.mapValues(chartItems, (_item, _itemId) => {
              if (connectedIdList.includes(_itemId) && Object.keys(selectedChartItem).includes(_itemId)) {
                return {
                  ..._item,
                  connectionIds: _.mapValues(_item.connectionIds, (_connectPoints, _dir) =>
                    _connectPoints.map((_point) => {
                      if (_point.connectParentId === _groupId) {
                        return {
                          ..._point,
                          connectParentId: newIds[rootId],
                        };
                      } else {
                        return _point;
                      }
                    })
                  ),
                };
              }

              return _item;
            }),
            ...Object.keys(newIds).reduce((_acc, _oldId) => {
              return {
                ..._acc,
                [newIds[_oldId]]: {
                  ...chartItems[_oldId],
                  id: newIds[_oldId],
                  connectionIds: _.mapValues(chartItems[_oldId].connectionIds, (_connectPoints, _dir) => {
                    let pointList = [..._connectPoints];

                    if (_oldId === rootId) {
                      pointList = [...pointList, ...(connectionIds[_dir] || [])];
                    }

                    return pointList.map((_point) => ({
                      ..._point,
                      parentId: newIds[_oldId],
                      connectParentId: newIds[_point.connectParentId]
                        ? newIds[_point.connectParentId]
                        : _point.connectParentId,
                    }));
                  }),
                },
              };
            }, {}),
          },
        });

        // 3. 기존 itemsPos에서 group[_groupId]의 아이템 아이디 리스트의 pos를 복사하여 새로운 itemsPos를 추가함, 기존 값을 삭제할 필요는 없음
        operations.push({
          key: 'itemsPos',
          value: {
            ...itemsPos,
            ...Object.keys(newIds).reduce((_acc, _oldId) => {
              let _itemPos = itemsPos[_oldId];
              const _sceneList = Object.keys(_itemPos);

              if (_sceneList.includes(_groupId) && _sceneList.includes(selectedSceneId)) {
                // 위치정보에 현재 언그룹하는 groupId가 있다면 배제해야함
                _itemPos = _.pickBy(_itemPos, (_pos, _sceneId) => _sceneId !== _groupId);
              } else if (_sceneList.includes(_groupId) && !_sceneList.includes(selectedSceneId)) {
                // 위치정보에 현재 장면에 관한 위치 정보가 없다면 추가해야함
                _itemPos = {
                  ..._itemPos,
                  [selectedSceneId]: Object.values(_itemPos)[0],
                };
              } else {
                // 위의 경우가 아닐 경우
              }

              return {
                ..._acc,
                [newIds[_oldId]]: _itemPos,
              };
            }, {}),
          },
        });
        // 4. selectedGroupId의 값이 없다면 현재 보고 있는 장면에 새로 붙여넣어야 하는 아이디 리스트를 추가함 + groupId는 제거
        if (!selectedGroupId) {
          operations.push({
            key: `scene.${selectedSceneId}.itemIds`,
            value: [...sceneItemIds.filter((_id) => _groupId !== _id), ...Object.values(newIds)],
          });
        }
      } else {
        // 다른 장면에서 사용중이지 않는 그룹이라면 그룹을 해제함

        operations = [
          {
            key: `group`,
            value: _.mapValues(
              _.pickBy(group, (_var, __id) => _groupId !== __id),
              (_itemIdList, __groupId) => {
                if (__groupId === selectedGroupId) {
                  return [..._itemIdList, ...groupedItemIdList].filter((_id) => _id !== _groupId);
                }

                return _itemIdList;
              }
            ),
          },
          {
            key: 'items',
            value: _.mapValues(
              _.pickBy(chartItems, (_item, _itemId) => _itemId !== _groupId),
              (_item, _itemId) => {
                if (connectedIdList.includes(_itemId)) {
                  return {
                    ..._item,
                    connectionIds: _.mapValues(_item.connectionIds, (_connectPoints, _dir) =>
                      _connectPoints.map((_point) => {
                        if (_point.connectParentId === _groupId) {
                          return {
                            ..._point,
                            connectParentId: rootId,
                          };
                        } else {
                          return _point;
                        }
                      })
                    ),
                  };
                } else if (_itemId === rootId) {
                  return {
                    ..._item,
                    connectionIds: _.mapValues(_item.connectionIds, (_connectPoints, _dir) => {
                      return _.uniqBy([..._connectPoints, ...(connectionIds[_dir] || [])], 'connectParentId');
                    }),
                  };
                }

                return _item;
              }
            ),
          },
          {
            key: `itemsPos`,
            value: _.mapValues(itemsPos, (_itemPos) => {
              const _sceneList = Object.keys(_itemPos);

              if (_sceneList.includes(_groupId) && _sceneList.includes(selectedSceneId)) {
                // 위치정보에 현재 언그룹하는 groupId가 있다면 배제해야함
                return _.pickBy(_itemPos, (_pos, _sceneId) => _sceneId !== _groupId);
              } else if (_sceneList.includes(_groupId) && !_sceneList.includes(selectedSceneId)) {
                // 위치정보에 현재 장면에 관한 위치 정보가 없다면 추가해야함
                return {
                  ..._itemPos,
                  [selectedSceneId]: Object.values(_itemPos)[0],
                };
              } else {
                // 위의 경우가 아닐 경우
                return _itemPos;
              }
            }),
          },
        ];

        if (!selectedGroupId) {
          operations.push({
            key: `scene.${selectedSceneId}.itemIds`,
            value: [...sceneItemIds.filter((_id) => _groupId !== _id), ...group[_groupId]],
          });
        }
      }

      dispatch(setOpenedGroupIdListAction(openedGroupIdList.filter((_id) => _groupId !== _id)));
      dispatch(setDocumentValueAction(operations));
    };

    ipcRenderer.on(REQUEST_MAKE_GROUP, handleRequestMakeGroup);
    ipcRenderer.on(REQUEST_UNGROUP, handleRequestUngroup);

    return () => {
      ipcRenderer.removeAllListeners(REQUEST_MAKE_GROUP);
      ipcRenderer.removeAllListeners(REQUEST_UNGROUP);
    };
  }, [chartItems, itemsPos, selectedChartItem, selectedSceneId, group, selectedGroupId]);

  useEffect(() => {
    const handleEditGroup = (_e, _groupId) => {
      dispatch(setSelectedGroupIdAction(_groupId));

      dispatch(setOpenedGroupIdListAction([...openedGroupIdList, _groupId]));
    };

    ipcRenderer.on(REQUEST_EDIT_GROUP, handleEditGroup);

    return () => {
      ipcRenderer.removeAllListeners(REQUEST_EDIT_GROUP);
    };
  }, [openedGroupIdList]);

  useEffect(() => {
    const handleRequestChangeRoot = (_e, { groupId, itemId }) => {
      dispatch(
        setDocumentValueAction({
          key: `items.${groupId}.rootId`,
          value: itemId,
        })
      );
    };

    ipcRenderer.on(REQUEST_CHANGE_ROOT, handleRequestChangeRoot);

    return () => {
      ipcRenderer.removeAllListeners(REQUEST_CHANGE_ROOT);
    };
  }, [chartItems, group, selectedGroupId]);

  useEffect(() => {
    let position = { x: 0, y: 0 };

    const handleSetTempPosition = (_event) => {
      position = {
        x: _event.clientX,
        y: _event.clientY,
      };
    };

    document.addEventListener('mousemove', handleSetTempPosition);

    const handleAddNote = () => {
      const zoomArea = document.getElementById(ZOOM_AREA_ELEMENT_ID);

      const { x, y } = convertClientPosToLocalPos(position);

      const [newFlowItem, pos, newItemId] = makeNewItem(
        zoomArea,
        chartItems,
        selectedChartItem,
        itemsPos,
        ChartItemType.note,
        selectedSceneId,
        { left: x - transX, top: y - transY }
      );

      const operations: Operation[] = [
        {
          key: 'items',
          value: {
            ...chartItems,
            [newItemId]: newFlowItem,
          },
        },
        {
          key: `itemsPos`,
          value: {
            ...itemsPos,
            [newItemId]: pos,
          },
        },
      ];

      if (selectedGroupId) {
        operations.push({
          key: `group.${selectedGroupId}`,
          value: [...group[selectedGroupId], newItemId],
        });
      } else {
        operations.push({
          key: `scene.${selectedSceneId}.itemIds`,
          value: [...sceneItemIds, newItemId],
        });
      }

      dispatch(setDocumentValueAction(operations));
    };

    ipcRenderer.on(REQUEST_ADD_MEMO, handleAddNote);

    return () => {
      document.removeEventListener('mousemove', handleSetTempPosition);
      ipcRenderer.removeAllListeners(REQUEST_ADD_MEMO);
    };
  }, [chartItems, selectedChartItem, itemsPos, selectedSceneId, sceneItemIds, selectedGroupId, scale, transX, transY]);

  useEffect(() => {
    const handleRequestDelete = (_e, _idList) => {
      deleteItems(null, _idList);
    };

    ipcRenderer.on(REQUEST_DELETE, handleRequestDelete);

    return () => {
      ipcRenderer.removeAllListeners(REQUEST_DELETE);
    };
  }, [multiSelectedItemList]);

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

      const deleteTargetIdList = _targetIdList.filter((_itemId) => {
        if (selectedChartItem[_itemId].elType === ChartItemType.body) {
          return false;
        } else if (selectedGroupId && (chartItems[selectedGroupId] as ChartGroupItem).rootId === _itemId) {
          return false;
        }

        return true;
      });

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

    if (_next || selectedConnectionPoint.current) {
      const preP = { x: _origin.left + transX, y: _origin.top + transY };
      let nexP;

      if (_next && _next.el !== _origin.el) {
        _ctx.strokeStyle = getCanvasLineColor(_origin.connectType, _next.connectType);
        _ctx.globalAlpha = 0.5;

        // _ctx.lineTo(_next.left + transX, _next.top + transY);

        nexP = { x: _next.left + transX, y: _next.top + transY };
      } else if (_type === 'line' && selectedConnectionPoint.current) {
        // _ctx.lineTo(selectedConnectionPoint.current.left + transX, selectedConnectionPoint.current.top + transY);

        nexP = { x: selectedConnectionPoint.current.left + transX, y: selectedConnectionPoint.current.top + transY };
      }

      if (nexP) {
        const _centerX = (preP.x + nexP.x) / 2;
        _ctx.bezierCurveTo(_centerX, preP.y, _centerX, nexP.y, nexP.x, nexP.y);
      }
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
          ...(_connectDir !== 'left' ? _.compact(selectedChartItem[_pathKey]?.connectionVariables || []) : []),
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

    if (_.intersection([originConnectType, targetConnectType], CHART_TEXT_ITEMS).length > 0) {
      return _.intersection([_elType, _targetType], CHART_TEXT_ITEMS).length > 0;
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

  const handleContextMenu = () => {
    sendContextOpen({
      selectedIdList: Object.keys(multiSelectedItemList),
    });
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
      onContextMenu={handleContextMenu}
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
            selectedIdList={Object.keys(multiSelectedItemList)}
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

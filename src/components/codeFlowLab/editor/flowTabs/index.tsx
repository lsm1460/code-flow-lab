import { RootState } from '@/reducers';
import {
  Operation,
  setDocumentValueAction,
  setOpenedGroupIdListAction,
  setSceneOrderAction,
  setSelectedGroupIdAction,
} from '@/reducers/contentWizard/mainDocument';
import { filterDeleteTargetId, getRandomId } from '@/utils/content';
import classNames from 'classnames/bind';
import _ from 'lodash';
import { useMemo } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { ReactSortable } from 'react-sortablejs';
import { makeNewRoot } from '../flowChart/utils';
import styles from './flowTabs.module.scss';
const cx = classNames.bind(styles);

function FlowTabs() {
  const dispatch = useDispatch();

  const { selectedGroupId, openedGroupIdList, sceneOrder, flowScene, flowItems, group, flowItemsPos } = useSelector(
    (state: RootState) => ({
      selectedGroupId: state.selectedGroupId,
      openedGroupIdList: state.openedGroupIdList,
      sceneOrder: state.sceneOrder,
      flowScene: state.contentDocument.scene,
      flowItems: state.contentDocument.items,
      group: state.contentDocument.group,
      flowItemsPos: state.contentDocument.itemsPos,
    }),
    shallowEqual
  );

  const sceneList = useMemo(
    () =>
      Object.keys(flowScene)
        .map((_key, _i) => ({ id: _key, name: flowScene[_key].name, order: flowScene[_key].order }))
        .sort((a, b) => a.order - b.order),
    [flowScene]
  );

  const groupList = useMemo(() => {
    return openedGroupIdList.map((id, _i) => ({ id, name: flowItems[id].name, order: _i }));
  }, [flowItems, group, openedGroupIdList]);

  const selectScene = (_sceneOrder: number) => {
    dispatch(setSceneOrderAction(_sceneOrder));
  };

  const handleAddScene = () => {
    const _sceneId = getRandomId();

    const newSceneOrder = Object.keys(flowScene).length + 1;
    const newRootBlock = makeNewRoot();

    const operations = [
      {
        key: `items`,
        value: {
          ...flowItems,
          [newRootBlock.id]: newRootBlock,
        },
      },
      {
        key: 'itemsPos',
        value: {
          ...flowItemsPos,
          [newRootBlock.id]: {
            [_sceneId]: {
              left: 24,
              top: 57,
            },
          },
        },
      },
      {
        key: 'scene',
        value: {
          ...flowScene,
          [_sceneId]: {
            name: `scene-${newSceneOrder}`,
            itemIds: [newRootBlock.id],
            order: newSceneOrder,
          },
        },
      },
    ];

    dispatch(setDocumentValueAction(operations));

    dispatch(setSceneOrderAction(newSceneOrder));
  };

  const removeScene = (_sceneId: string) => {
    if (
      !window.confirm(
        '삭제하시겠습니까?\n해당 장면에 포함된 블록들이 모두 지워집니다. 해당 장면에서 생성한 글로벌 변수는 변수 패널에서도 확인할 수 있습니다.'
      )
    ) {
      return;
    }

    const deleteItemIdList = filterDeleteTargetId(flowItems, group, flowScene, flowScene[_sceneId].itemIds);

    let newItemPoses = _.pickBy(flowItemsPos, (_pos, _itemId) => !deleteItemIdList.includes(_itemId));
    newItemPoses = _.mapValues(newItemPoses, (_pos) => _.pickBy(_pos, (__pos, __sceneId) => __sceneId !== _sceneId));

    const operations = [
      {
        key: `items`,
        value: _.pickBy(flowItems, (_item) => !deleteItemIdList.includes(_item.id)),
      },
      {
        key: 'itemsPos',
        value: newItemPoses,
      },
      {
        key: 'scene',
        value: _.pickBy(flowScene, (_scene, __sceneId) => __sceneId !== _sceneId),
      },
    ];

    // 순서를 먼저 변경하고 삭제과정 처리 진행
    dispatch(setSceneOrderAction(Math.max(1, sceneOrder - 1)));

    dispatch(setDocumentValueAction(operations));
  };

  const setList = (
    _list: {
      id: string;
      name: string;
      chosen?: boolean;
    }[]
  ) => {
    let isChanged = false;

    for (let _i = 0; _i < _list.length; _i++) {
      if (flowScene[_list[_i].id].order !== _i + 1) {
        isChanged = true;

        break;
      }
    }

    if (!isChanged) {
      return;
    }

    const changedTabOrder = _.findIndex(_list, (_item) => _.isBoolean(_item.chosen));

    const operations: Operation[] = _list.map((_item, _i) => ({ key: `scene.${_item.id}.order`, value: _i + 1 }));

    dispatch(setDocumentValueAction(operations));

    dispatch(setSceneOrderAction(changedTabOrder + 1));
  };

  const setGroupList = (
    _list: {
      id: string;
      name: string;
      chosen?: boolean;
    }[]
  ) => {
    const _ids = _list.map((_item) => _item.id);
    let isChanged = !_.isEqual(openedGroupIdList, _ids);

    if (!isChanged) {
      return;
    }

    const changedTabOrder = _.findIndex(_list, (_item) => _.isBoolean(_item.chosen));

    dispatch(setOpenedGroupIdListAction(_ids));

    dispatch(setSelectedGroupIdAction(_list[changedTabOrder].id));
  };

  const closeGroup = (_groupId) => {
    dispatch(setSelectedGroupIdAction(''));

    dispatch(setOpenedGroupIdListAction(openedGroupIdList.filter((_id) => _id !== _groupId)));
  };

  return (
    <div className={cx('flow-tabs-wrap')}>
      <div className={cx('flow-tabs')}>
        <div className={cx('scene-list')}>
          <ReactSortable list={groupList} setList={setGroupList}>
            {groupList.map((_group) => (
              <div
                className={cx('tab', { active: _group.id === selectedGroupId })}
                key={_group.id}
                onClick={() => {
                  dispatch(setSelectedGroupIdAction(_group.id));
                }}
                onMouseUp={(_event) => {
                  _event.stopPropagation();
                  if (_event.button === 1) {
                    closeGroup(_group.id);
                  }
                }}
              >
                {_group.name}
                <button
                  onClick={(_event) => {
                    _event.stopPropagation();

                    closeGroup(_group.id);
                  }}
                >
                  <i className="material-symbols-outlined">close</i>
                </button>
              </div>
            ))}
          </ReactSortable>
          <ReactSortable list={sceneList} setList={setList}>
            {sceneList.map((_scene, _i) => (
              <div
                key={_scene.id}
                className={cx('tab', { active: !selectedGroupId && _i + 1 === sceneOrder })}
                onClick={() => {
                  dispatch(setSelectedGroupIdAction(''));

                  selectScene(_i + 1);
                }}
                onMouseUp={(_event) => {
                  _event.stopPropagation();
                  if (_event.button === 1) {
                    removeScene(_scene.id);
                  }
                }}
              >
                {_scene.name}
                {_i !== 0 && (
                  <button
                    onClick={(_event) => {
                      _event.stopPropagation();

                      removeScene(_scene.id);
                    }}
                  >
                    <i className="material-symbols-outlined">close</i>
                  </button>
                )}
              </div>
            ))}
          </ReactSortable>
          <div className={cx('add-scene-wrap')}>
            <button onClick={handleAddScene}>
              <i className="material-symbols-outlined">add</i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FlowTabs;

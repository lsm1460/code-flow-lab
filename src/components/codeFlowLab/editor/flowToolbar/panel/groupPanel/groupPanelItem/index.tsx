import { ChartGroupItem } from '@/consts/types/codeFlowLab';
import { RootState } from '@/reducers';
import { getSceneId } from '@/utils/content';
import classNames from 'classnames/bind';
import { useMemo } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import styles from './groupPanelItem.module.scss';
const cx = classNames.bind(styles);

interface Props {
  chartItem: ChartGroupItem;
}
function GroupPanelItem({ chartItem }: Props) {
  const dispatch = useDispatch();

  const { selectedGroupId, sceneId, flowScene, flowItemsPos } = useSelector((state: RootState) => {
    const sceneId = getSceneId(state.contentDocument.scene, state.sceneOrder);

    return {
      selectedGroupId: state.selectedGroupId,
      sceneId,
      sceneOrder: state.sceneOrder,
      flowScene: state.contentDocument.scene,
      flowItemsPos: state.contentDocument.itemsPos,
    };
  }, shallowEqual);

  const sceneOrderList = useMemo(
    () =>
      Object.values(flowScene).reduce((_acc, _cur) => {
        if (_cur.itemIds.includes(chartItem.id)) {
          return [..._acc, _cur.order];
        }

        return _acc;
      }, [] as number[]),
    [flowScene]
  );

  return (
    <div className={cx('panel-item')}>
      <p className={cx('panel-title', chartItem.elType)}>
        <span>{chartItem.name}</span>
      </p>

      <ul className={cx('btn-list')}>
        <li>
          <button>Use as a new group</button>
        </li>
        <li>
          <button>Edit group</button>
        </li>
        <li>
          <button>Delete group</button>
        </li>
      </ul>

      <div className={cx('panel-desc')}>
        <p className={cx('scene-list-title')}>used scene index list</p>
        <ul className={cx('scene-list')}>
          {sceneOrderList.map((_order) => (
            <li key={_order}>scene-{_order}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default GroupPanelItem;

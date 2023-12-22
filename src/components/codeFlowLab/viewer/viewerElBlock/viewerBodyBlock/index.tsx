import { ROOT_BLOCK_ID } from '@/consts/codeFlowLab/items';
import { ChartItemType, TriggerProps, ViewerItem } from '@/consts/types/codeFlowLab';
import { RootState } from '@/reducers';
import { CSSProperties, RefObject } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import ViewerElBlock from '..';
import _ from 'lodash';
import classNames from 'classnames/bind';
import styles from './viewerBodyBlock.module.scss';
import { getSceneId } from '@/utils/content';
const cx = classNames.bind(styles);

interface Props {
  elRef: RefObject<HTMLDivElement>;
  viewerItem: ViewerItem;
  triggerProps: TriggerProps;
  addedStyle: CSSProperties;
  isOnlyViewer: boolean;
}
function ViewerBodyBlock({ elRef, viewerItem, triggerProps, isOnlyViewer }: Props) {
  const addedStyle = useSelector((state: RootState) => {
    const sceneId = getSceneId(state.contentDocument.scene, state.sceneOrder, state.selectedGroupId);
    const _idList = state.contentDocument.scene[sceneId]?.itemIds || [];
    const rootItem = _.find(
      state.contentDocument.items,
      (_item) => _item.elType === ChartItemType.body && _idList.includes(_item.id)
    );

    return state.addedStyles[rootItem?.id] || {};
  }, shallowEqual);

  return (
    <div
      ref={elRef}
      className={cx('viewer-wrap', { 'in-viewer': isOnlyViewer })}
      style={{ ...viewerItem.styles, ...addedStyle }}
      {...triggerProps}
    >
      {viewerItem.children.map((_item) => (
        <ViewerElBlock key={_item.id} viewerItem={_item} isOnlyViewer={isOnlyViewer} />
      ))}
    </div>
  );
}

export default ViewerBodyBlock;

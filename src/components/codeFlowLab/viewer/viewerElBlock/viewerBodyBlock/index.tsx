import { ROOT_BLOCK_ID } from '@/consts/codeFlowLab/items';
import { TriggerProps, ViewerItem } from '@/consts/types/codeFlowLab';
import { RootState } from '@/reducers';
import { CSSProperties, RefObject } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import ViewerElBlock from '..';

import classNames from 'classnames/bind';
import styles from './viewerBodyBlock.module.scss';
const cx = classNames.bind(styles);

interface Props {
  elRef: RefObject<HTMLDivElement>;
  viewerItem: ViewerItem;
  triggerProps: TriggerProps;
  variables: {
    [x: string]: any;
  };
  addedStyle: CSSProperties;
}
function ViewerBodyBlock({ elRef, viewerItem, triggerProps, variables }: Props) {
  const addedStyle = useSelector(
    (state: RootState) => state.addedStyles[`${ROOT_BLOCK_ID}-${state.sceneOrder}`],
    shallowEqual
  );

  return (
    <div ref={elRef} className={cx('viewer-wrap')} style={{ ...viewerItem.styles, ...addedStyle }} {...triggerProps}>
      {viewerItem.children.map((_item) => (
        <ViewerElBlock key={_item.id} viewerItem={_item} variables={variables} />
      ))}
    </div>
  );
}

export default ViewerBodyBlock;

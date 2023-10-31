import { ChartLinkItem, TriggerProps, ViewerItem } from '@/consts/types/codeFlowLab';
import { CSSProperties, RefObject } from 'react';
import ViewerElBlock from '..';

interface LinkViewerItem extends ViewerItem {
  link?: ChartLinkItem['link'];
}

interface Props {
  elRef: RefObject<HTMLAnchorElement>;
  viewerItem: LinkViewerItem;
  triggerProps: TriggerProps;
  variables: {
    [x: string]: any;
  };
  addedStyle: CSSProperties;
}
function ViewerLinkBlock({ elRef, viewerItem, triggerProps, variables, addedStyle }: Props) {
  return (
    <a
      ref={elRef}
      style={{ ...viewerItem.styles, ...addedStyle }}
      {...triggerProps}
      href={viewerItem.link}
      target="_blank"
    >
      {viewerItem.children.map((_item) => (
        <ViewerElBlock key={_item.id} viewerItem={_item} variables={variables} />
      ))}
    </a>
  );
}

export default ViewerLinkBlock;

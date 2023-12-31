import useIpcManager from '@/components/codeFlowLab/useIpcManager';
import { ChartLinkItem, TriggerProps, ViewerItem } from '@/consts/types/codeFlowLab';
import { CSSProperties, RefObject, useEffect } from 'react';
import ViewerElBlock from '..';

interface LinkViewerItem extends ViewerItem {
  link?: ChartLinkItem['link'];
}

interface Props {
  elRef: RefObject<HTMLAnchorElement>;
  viewerItem: LinkViewerItem;
  triggerProps: TriggerProps;
  addedStyle: CSSProperties;
  mapItem;
  isOnlyViewer: boolean;
}
function ViewerLinkBlock({ elRef, viewerItem, triggerProps, addedStyle, mapItem, isOnlyViewer }: Props) {
  const { sendOpenBrowser } = useIpcManager(false);

  useEffect(() => {
    const handleLink = (_event: MouseEvent) => {
      _event.preventDefault();

      viewerItem.link && sendOpenBrowser(viewerItem.link);
    };

    elRef.current.addEventListener('click', handleLink);

    return () => {
      elRef.current.removeEventListener('click', handleLink);
    };
  }, [elRef, viewerItem.link]);

  return (
    <a
      ref={elRef}
      style={{ ...viewerItem.styles, ...addedStyle }}
      {...triggerProps}
      href={viewerItem.link}
      target="_blank"
    >
      {viewerItem.children.map((_item) => (
        <ViewerElBlock key={_item.id} viewerItem={_item} mapItem={mapItem} isOnlyViewer={isOnlyViewer} />
      ))}
    </a>
  );
}

export default ViewerLinkBlock;

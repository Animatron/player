package spec;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public abstract class Node {

    static long NULL = -1;
    static Node lastHoveredNode;
    static Node pressedNode;

    Node parent;

    protected final List<Node> children = new ArrayList<>();
    Set<Listener> listeners = new HashSet<>();

    long hoveredEventId = NULL;

    public Node addChildren(Node... child) {
        for (Node each : child) {
            this.children.add(each);
            each.parent = this;
        }
        return this;
    }

    public abstract Point transformToChild(Node child, Point point);

    public abstract boolean contains(Point point);

    public Node addListener(Listener listener) {
        this.listeners.add(listener);
        return this;
    }

    public boolean dispatch(MouseEvent event) {
        return dispatch(event, event.point);
    }

    private boolean dispatch(MouseEvent event, Point point) {
        if (event.type == MouseEvent.Type.release && pressedNode != null) {
            Node.pressedNode.notifyRelease(convertToChild(point, Node.pressedNode));
            Node.pressedNode = null;
            return true;
        }


        if (contains(point)) {
            for (int i = children.size() - 1; i >=0; i--) {
                Node each = children.get(i);
                if (each.dispatch(event, transformToChild(each, point))) return true;
            }

            switch (event.type) {
                case press:
                    notifyPress(point);
                    pressedNode = this;
                    return true;
                case move:
                    processHover(event);
                    return true;
            }
        }


        return false;
    }

    private Point convertToChild(Point point, Node child) {
        List<Node> path = new ArrayList<>();
        Node each = child;
        while (each != null) {
            path.add(0, each);
            each = each.parent;
        }

        Point eachPoint = point;
        for (int i = 0; i < path.size() - 1; i++) {
            eachPoint = path.get(i).transformToChild(path.get(i + 1), eachPoint);
        }
        return eachPoint;
    }

    void markAsHoveredTree(long eventId) {
        this.hoveredEventId = eventId;
        if (parent != null) {
            parent.markAsHoveredTree(eventId);
        }
    }

    Node processOut(long eventId) {
        boolean processParent = false;
        if (hoveredEventId != NULL) {
            if (hoveredEventId != eventId) {
                hoveredEventId = NULL;
                notifyOut();
                processParent = true;
            }
        }

        if (processParent && parent != null) {
            return parent.processOut(eventId);
        }

        return this;
    }

    private void notifyPress(Point point) {
        for (Listener each : listeners) {
            each.onPress(point);
        }
    }

    private void notifyRelease(Point point) {
        for (Listener each : listeners) {
            each.onRelease(point);
        }
    }

    private void notifyOut() {
        for (Listener each : listeners) {
            each.onOut();
        }
    }

    private void notifyIn() {
        for (Listener each : listeners) {
            each.onIn();
        }
    }

    void processHover(MouseEvent event) {
        markAsHoveredTree(event.id);
        hoveredEventId = event.id;

        if (lastHoveredNode == this) {
            return;
        }


        Node commonChild = null;
        if (lastHoveredNode != null) {
            commonChild = lastHoveredNode.processOut(event.id);
        }

        lastHoveredNode = this;

        processIn(commonChild);
    }

    private void processIn(Node commonChild) {
        List<Node> inPath = new ArrayList<>();
        Node each = this;
        while (each != null) {
            if (each == commonChild) break;
            inPath.add(each);
            each = each.parent;
        }

        for (int i = inPath.size() - 1; i >=0; i--) {
            inPath.get(i).notifyIn();
        }
    }

    public interface Listener {
        void onPress(Point point);
        void onRelease(Point point);
        void onIn();
        void onOut();
    }

}

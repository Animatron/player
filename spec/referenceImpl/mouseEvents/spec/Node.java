package spec;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public abstract class Node {

    public final String name;

    static long NULL = -1;

    static Node lastHoveredNode;
    static Point lastHoveredPoint;

    static Node pressedNode;

    Node parent;

    protected final List<Node> children = new ArrayList<>();

    public Set<Listener.Press> presses = new HashSet<>();
    public Set<Listener.Release> releases = new HashSet<>();
    public Set<Listener.InOut> inOuts = new HashSet<>();
    public Set<Listener.Move> moves = new HashSet<>();

    long hoveredEventId = NULL;

    protected Node(String name) {
        this.name = name;
    }

    public Node addChildren(Node... child) {
        for (Node each : child) {
            this.children.add(each);
            each.parent = this;
        }
        return this;
    }

    public abstract Point transformToChild(Node child, Point point);
    public abstract Point transformToParent(Point point);

    public abstract boolean contains(Point point);

    protected boolean isComposite() {
        return children.size() > 0;
    }


    public Node onPress(Listener.Press press) {
        this.presses.add(press);
        return this;
    }

    public Node onRelease(Listener.Release release) {
        this.releases.add(release);
        return this;
    }

    public Node onInOut(Listener.InOut inOut) {
        this.inOuts.add(inOut);
        return this;
    }

    public Node onMove(Listener.Move move) {
        this.moves.add(move);
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

        Hit deepestFound = findDeepestChildAt(point);
        if (deepestFound == null) return false;

        switch (event.type) {
            case press:
                pressedNode = deepestFound.node.notifyPress(deepestFound.point);
                return true;
            case move:
                deepestFound.node.processHover(event, deepestFound.point);
                return true;
        }

        return false;
    }


    private Hit findDeepestChildAt(Point point) {
        if (isComposite()) {
            for (int i = children.size() - 1; i >=0; i--) {
                Node each = children.get(i);
                Hit foundChildNode = each.findDeepestChildAt(transformToChild(each, point));
                if (foundChildNode != null) return foundChildNode;
            }
        } else {
            return contains(point) ? new Hit(this, point) : null;
        }

        return null;
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

    private Node notifyPress(Point point) {
        if (presses.size() == 0) {
            if (parent != null) {
                return parent.notifyPress(transformToParent(point));
            } else {
                return null;
            }
        } else {
            for (Listener.Press each : presses) {
                each.onPress(point);
            }
            return this;
        }
    }

    private Node notifyMove(Point point) {
        if (moves.size() == 0) {
            if (parent != null) {
                return parent.notifyMove(transformToParent(point));
            } else {
                return null;
            }
        } else {
            for (Listener.Move each : moves) {
                each.onMove(point);
            }
            return this;
        }
    }

    private void notifyRelease(Point point) {
        for (Listener.Release each : releases) {
            each.onRelease(point);
        }
    }

    private void notifyOut() {
        for (Listener.InOut each : inOuts) {
            each.onOut();
        }
    }

    private void notifyIn() {
        for (Listener.InOut each : inOuts) {
            each.onIn();
        }
    }

    void processHover(MouseEvent event, Point point) {
        markAsHoveredTree(event.id);
        hoveredEventId = event.id;

        if (lastHoveredNode != this) {
            Node commonChild = null;
            if (lastHoveredNode != null) {
                commonChild = lastHoveredNode.processOut(event.id);
            }

            lastHoveredNode = this;

            processIn(commonChild);
        }

        if (lastHoveredPoint == null || (lastHoveredPoint.x != point.x || lastHoveredPoint.y != point.y)) {
            lastHoveredPoint = point;
            notifyMove(point);
        }
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

    class Hit {

        final Node node;
        final Point point;

        public Hit(Node node, Point point) {
            this.node = node;
            this.point = point;
        }
    }

    public interface Listener {

        interface Press extends Listener {
            void onPress(Point point);
        }

        interface Release extends Listener {
            void onRelease(Point point);
        }

        interface Move extends Listener {
            void onMove(Point point);
        }

        interface InOut extends Listener {
            void onIn();
            void onOut();
        }
    }

}

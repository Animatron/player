package spec;

public class MouseEvent {

    public final Type type;
    public final Point point;
    public final long id;

    public enum Type {
        press, move
    }

    private static long nextEventId;

    public MouseEvent(int x, int y, Type type) {
        this.point = new Point(x, y);
        this.type = type;
        this.id = nextEventId++;
    }

}

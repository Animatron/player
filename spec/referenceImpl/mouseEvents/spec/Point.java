package spec;

public class Point {
    public final int x, y;

    public Point(int x, int y) {
        this.x = x;
        this.y = y;
    }

    @Override
    public int hashCode() {
        return x*1000+y;
    }

    @Override
    public boolean equals(Object obj) {
        Point that = (Point) obj;
        return that.x == x && that.y == y;
    }

    @Override
    public String toString() {
        return "["+x+","+y+"]";
    }
}

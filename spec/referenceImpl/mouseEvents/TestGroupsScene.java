import junit.framework.TestCase;
import spec.MouseEvent;
import test.TestLog;
import test.TestNode;

public class TestGroupsScene extends TestCase {

    private TestNode root;
    private TestNode group;
    private TestNode child1;
    private TestNode child2;
    private TestNode notChild;

    private TestLog log = new TestLog();


    /*
                                                               ∞
        +-group- - - - - - - - - - - - - - - - - - - - - - - - -
        |

        |
               (40,40) 20
        |      +---------+ <-- child1
               | (50,50) |
        |   20 |   +---+--------+
               |   +---+ 5 <------------ this small one (`notChild`) is not in group !!
        |      +---| 5          | 30
                   |            | <-- child2
        |          |            |
                   +------------+
        |                30

      ∞ |                                                                    */

    @Override
    protected void setUp() throws Exception {
        root = new TestNode("root", 0, 0, 1000, 1000);
        group = new TestNode("group", 0, 0, 1000, 1000);
        child1 = new TestNode("child1", 40, 40, 20, 20);
        child2 = new TestNode("child2", 50, 50, 30, 30);
        notChild = new TestNode("notChild", 50, 50, 5, 5);
        group.addChildren(child1, child2);
        root.addChildren(group);
        root.addChildren(notChild);
        log.addTo(root, group, child1, child2, notChild);
    }

    public void testPress() {
        assertDispatchPress(
                56, 56,
                "child2: press@6,6"
        );

        assertDispatchPress(
                10, 10,
                ""
        );

        assertDispatchPress(
                42, 45,
                "child1: press@2,5"
        );

        assertDispatchPress(
                62, 65,
                "child2: press@12,15"
        );

        assertDispatchPress(
                52, 53,
                "notChild: press@2,3"
        );
    }

    public void testOnlyInOut() {
        root.moves.clear();
        group.moves.clear();
        notChild.moves.clear();
        child1.moves.clear();
        child2.moves.clear();

        root.dispatch(new MouseEvent(53, 53, MouseEvent.Type.move));
        root.dispatch(new MouseEvent(60, 60, MouseEvent.Type.move));
        root.dispatch(new MouseEvent(56, 56, MouseEvent.Type.move));

        assertEquals(
                "root: in\n" +
                "notChild: in\n" +
                "notChild: out\n" +
                "group: in\n" +
                "child2: in"
                , log.get());

        log.clear();

        root.dispatch(new MouseEvent(53, 53, MouseEvent.Type.move));
        root.dispatch(new MouseEvent(45, 45, MouseEvent.Type.move));

        assertEquals(
                "child2: out\n" +
                "group: out\n" +
                "notChild: in\n" +
                "notChild: out\n" +
                "group: in\n" +
                "child1: in"
                , log.get());
    }

    public void testInOutAndMove() {
        root.dispatch(new MouseEvent(53, 53, MouseEvent.Type.move));
        root.dispatch(new MouseEvent(60, 60, MouseEvent.Type.move));
        root.dispatch(new MouseEvent(56, 56, MouseEvent.Type.move));

        assertEquals(
                "root: in\n" +
                "notChild: in\n" +
                "notChild: move@3,3\n" +
                "notChild: out\n" +
                "group: in\n" +
                "child2: in\n" +
                "child2: move@10,10\n" +
                "child2: move@6,6"
                , log.get());
    }

    public void testInOutDispatchesToParent() {
        root.moves.clear();
        group.moves.clear();
        notChild.moves.clear();
        child1.moves.clear();
        child2.moves.clear();

        notChild.inOuts.clear();
        child2.inOuts.clear();

        root.dispatch(new MouseEvent(53, 53, MouseEvent.Type.move));
        root.dispatch(new MouseEvent(60, 60, MouseEvent.Type.move));
        root.dispatch(new MouseEvent(56, 56, MouseEvent.Type.move));

        assertEquals(
                "root: in\n" +
                "group: in"
                , log.get());

        log.clear();

        root.dispatch(new MouseEvent(53, 53, MouseEvent.Type.move));
        root.dispatch(new MouseEvent(45, 45, MouseEvent.Type.move));

        assertEquals(
               "group: out\n" +
               "group: in\n" +
               "child1: in", log.get());
    }

    void assertDispatchPress(int x, int y, String expected) {
        MouseEvent event = new MouseEvent(x, y, MouseEvent.Type.press);
        root.dispatch(event);
        assertEquals(expected, log.get());
        log.clear();
    }

    void assertDispatchMove(int x, int y, String expected) {
        MouseEvent event = new MouseEvent(x, y, MouseEvent.Type.move);
        root.dispatch(event);
        assertEquals(expected, log.get());
        log.clear();
    }



}

import org.junit.*;
import org.junit.Test;
import spec.Point;

import static junit.framework.Assert.assertFalse;
import static junit.framework.Assert.assertTrue;
import static junit.framework.TestCase.assertEquals;

public class TimelineTests {

    private Clip c1;
    private Element e1;
    private Element e2;
    private Element e3;
    private Clip c2;
    private Element e4;
    private Element e5;
    private Clip c3;
    private Element e6;
    private Element e7;
    private Scene s1;
    private Clip c4;
    private Element e8;
    private Element e9;
    private Scene s2;
    private Movie m;

    @Test
    public void testSimplePlayback() {
        assertEquals(50.0, m.duration());
        assertEquals(0.0, m.playHead());
        assertEquals(0.0, s1.playHead());
        assertEquals(0.0, c1.playHead());

        m.tick(1);
        assertEquals(1.0, m.playHead());
        assertEquals(1.0, s1.playHead());
        assertEquals(1.0, c1.playHead());
        assertTrue(m.isVisible(c1));
        assertTrue(m.isVisible(e1));
        assertFalse(m.isVisible(c2));
        assertFalse(m.isVisible(c3));
        assertFalse(m.isVisible(e2));
        assertFalse(m.isVisible(e3));
        assertFalse(m.isVisible(e4));
        assertFalse(m.isVisible(e5));

        m.tick(4); // 5
        assertEquals(5.0, m.playHead());
        assertEquals(5.0, s1.playHead());
        assertEquals(5.0, c1.playHead());
        assertTrue(m.isVisible(c1));
        assertTrue(m.isVisible(e1));
        assertTrue(m.isVisible(e2));
        assertTrue(m.isVisible(c3));
        assertTrue(m.isVisible(e6));
        assertFalse(m.isVisible(e7));
        assertFalse(m.isVisible(c2));
        assertFalse(m.isVisible(e3));
        assertFalse(m.isVisible(e4));
        assertFalse(m.isVisible(e5));

        assertEquals(new Point(112, 112), c1.position);
        assertEquals(new Point(5, 5), e1.position);
        assertEquals(new Point(10, 10), e2.position);

        m.tick(1); // 6
        assertTrue(m.isVisible(e7));

        m.tick(5); // 11
        assertEquals(11.0, m.playHead());
        assertEquals(11.0, s1.playHead());
        assertEquals(11.0, c1.playHead());
        assertEquals(1.0, c2.playHead());
        assertEquals(5.0, c3.playHead());
        assertTrue(m.isVisible(c1));
        assertTrue(m.isVisible(e2));
        assertTrue(m.isVisible(c2));
        assertTrue(m.isVisible(e4));
        assertFalse(m.isVisible(e1));
        assertFalse(m.isVisible(e3));
        assertFalse(m.isVisible(e5));
        assertFalse(m.isVisible(c3));
        assertFalse(m.isVisible(e6));
        assertFalse(m.isVisible(e7));

        assertEquals(new Point(127, 127), c1.position);
        assertEquals(new Point(10, 10), e1.position);
        assertEquals(new Point(6, 6), e2.position);

        m.tick(15); // 26
        assertEquals(26.0, m.playHead());
        assertEquals(26.0, s1.playHead());
        assertEquals(26.0, c1.playHead());
        assertEquals(16.0, c2.playHead());
        assertEquals(5.0, c3.playHead());
        assertTrue(m.isVisible(c1));
        assertTrue(m.isVisible(e3));
        assertTrue(m.isVisible(c2));
        assertTrue(m.isVisible(e5));
        assertFalse(m.isVisible(e1));
        assertFalse(m.isVisible(e2));
        assertFalse(m.isVisible(e4));
        assertFalse(m.isVisible(c3));
        assertFalse(m.isVisible(e6));
        assertFalse(m.isVisible(e7));

        assertEquals(new Point(165, 165), c1.position);
        assertEquals(new Point(10, 10), e1.position);
        assertEquals(new Point(0, 0), e2.position);
        assertEquals(new Point(16, 16), e3.position);

        m.tick(20); // 46
        assertEquals(46.0, m.playHead());
        assertEquals(40.0, s1.playHead());
        assertEquals(6.0, s2.playHead());
        assertEquals(40.0, c1.playHead());
        assertEquals(30.0, c2.playHead());
        assertEquals(5.0, c3.playHead());
        assertEquals(6.0, c4.playHead());
        assertTrue(m.isVisible(s2));
        assertTrue(m.isVisible(c4));
        assertTrue(m.isVisible(e9));
        assertFalse(m.isVisible(s1));
        assertFalse(m.isVisible(c1));
        assertFalse(m.isVisible(c3));
        assertFalse(m.isVisible(e8));

        assertEquals(new Point(200, 200), c1.position);
        assertEquals(new Point(10, 10), e1.position);
        assertEquals(new Point(0, 0), e2.position);
        assertEquals(new Point(0, 0), e3.position);
    }

    /**
     *  Movie
     *    s1 dur=40
     *       c1   [0................................................40]  (100,100) -> (200,200)
     *         e1 [0..........10]                                        (0,0) -> (10,10)
     *         e2       [5................ 20]                           (10,10) -> (0,0)
     *         e3                                [25.........30]         (20,20) -> (0,0)
     *         c2               [10.................................40]
     *           e4             [0......10]
     *           e5                       [10......20]
     *       c3         [5....10]
     *         e6       [0..2]
     *         e7         [1..5]
     *    s2 dur=10
     *       c4    [0.....10]
     *         e8  [0.5]
     *         e9      [5.10]
     */
    @Before
    public void setup() {
        c1 = new Clip("c1", new TimeBand(0, 40));
        c1.addTranslate(new Point(100, 100), new Point(200, 200));

        e1 = new Element("e1", new TimeBand(0, 10));
        e1.addTranslate(new Point(0, 0), new Point(10, 10));
        e2 = new Element("e2", new TimeBand(5, 20));
        e2.addTranslate(new Point(10, 10), new Point(0, 0));
        e3 = new Element("e3", new TimeBand(25, 30));
        e3.addTranslate(new Point(20, 20), new Point(0, 0));

        c1.addChild(e1);
        c1.addChild(e2);
        c1.addChild(e3);

        c2 = new Clip("c2", new TimeBand(10, 40));
        e4 = new Element("e4", new TimeBand(0, 10));
        e5 = new Element("e5", new TimeBand(10, 20));
        c2.addChild(e4);
        c2.addChild(e5);

        c1.addChild(c2);

        c3 = new Clip("c3", new TimeBand(5, 10));
        e6 = new Element("e6", new TimeBand(0, 2));
        e7 = new Element("e7", new TimeBand(1, 5));
        c3.addChild(e6);
        c3.addChild(e7);

        s1 = new Scene("s1", 40);
        s1.addChild(c1);
        s1.addChild(c3);

        c4 = new Clip("c4", new TimeBand(0, 10));
        e8 = new Element("e8", new TimeBand(0, 5));
        e9 = new Element("e9", new TimeBand(5, 10));
        c4.addChild(e8);
        c4.addChild(e9);
        s2 = new Scene("s2", 10);
        s2.addChild(c4);

        m = new Movie();
        m.addScene(s1);
        m.addScene(s2);
    }
}

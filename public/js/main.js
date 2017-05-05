$(function () {
    $("#open_file_csv").on("change", function () {
        Draw($(this).val());
    })
    var width = 1200, height = 850, cRadius = 35, strokeWidth = 2, markerWidth = 5, markerHeight = 5, refX = cRadius + (markerWidth * 2) - 1.5, refY = 0;
    var force = d3.layout.force().charge(-4000).linkDistance(130).size([width, height]);
    var direct = "Click chọn 1 đỉnh để tìm đường đi ngắn nhất đến tất cả các đỉnh còn lại"

    function Draw(filename) {
        d3.select('#content svg').remove();
        var svg = d3.select("#content").append("svg")
            .attr("width", width)
            .attr("height", height);
        d3.csv("/files/" + filename + ".csv", function (error, data) {

            var nodes = [], nodesByName = {}, links = [];
            function addNodeByName(fullname) {
                var name = fullname.split(',')[0];
                if (!nodesByName[name]) {
                    var node = { "name": name, "links": [], preNode: null }
                    nodesByName[name] = node;
                    nodes.push(node);
                    return node;
                }
                else
                    return nodesByName[name];
            }

            data.forEach(function (d) {
                for (k in d) {
                    if (d.hasOwnProperty(k) && k != "nodes" && d[k] < 750) {
                        links.push({ "source": addNodeByName(d["nodes"]), "target": addNodeByName(k), "value": parseInt(d[k]), 'id': addNodeByName(d["nodes"]).name + addNodeByName(k).name })
                    }
                }
            });

            force.nodes(nodes).links(links).start();
            /*Set Marker arrow in the Link*/
            svg.append("svg:defs").selectAll("marker")
                .data(["arrow"])
                .enter().append("svg:marker")
                .attr("id", String)
                .attr("viewBox", "0 -5 10 10")/*Hinh tam giac*/
                .attr("refX", refX)/*Toa do x*/
                .attr("refY", refY)/*Toa do y*/
                .attr("markerWidth", markerWidth)
                .attr("markerHeight", markerHeight)
                .attr("orient", "auto")
                .attr("class", "marker")
                .append("svg:path")
                .attr("d", "M0,-5L10,0L0,5");

            var glink = svg.append('g').selectAll(".link")
                .data(links).enter()

            var link = glink.append("line")
                .attr("class", function (d) {
                    return "link " + d.id
                })
                .style("stroke-width", strokeWidth)
                .attr("marker-end", function (d) {
                    return "url(#arrow)";
                });


            var linktext = glink.append('text')
                .attr("class", function (d) {
                    return "linktext " + d.id
                }).attr('text-anchor', 'middle')
                .style('opacity', 1)
                .text(function (d) {
                    return d.value
                })

            var gnode = svg.append('g').selectAll(".node")
                .data(nodes).enter()

            var node = gnode.append("circle")
                .attr("class", function (d) {
                    return 'node ' + d.name
                })
                .attr("r", cRadius)
                .call(force.drag);

            var nodetext = gnode.append('text')
                .attr('text-anchor', 'middle')
                .attr('dy', '0.35em')
                .attr("class", function (d) {
                    return "nodetext " + d.name
                })
                .text(function (d) {
                    return d.name
                })


            link.each(function (d) {
                d.source.links.push(d);
                d.selection = d3.select(this);
            });

            node.each(function (d) {
                d.selection = d3.select(this);
            });

            force.on("tick", function () {
                link.attr("x1", function (d) {
                    return d.source.x;
                })
                    .attr("y1", function (d) {
                        return d.source.y;
                    })
                    .attr("x2", function (d) {
                        return d.target.x;
                    })
                    .attr("y2", function (d) {
                        return d.target.y;
                    });

                linktext.attr("x", function (d) {
                    return (d.source.x + d.target.x) / 2;
                })
                    .attr("y", function (d) {
                        return (d.source.y + d.target.y) / 2;
                    })

                nodetext.attr("x", function (d) {
                    return d.x;
                })
                    .attr("y", function (d) {
                        return d.y;
                    })

                node.attr("cx", function (d) {
                    return d.x;
                })
                    .attr("cy", function (d) {
                        return d.y;
                    });
            });

            function getStartNode(d) {
                if (!d.preNode) {
                    return d.name;
                }
                return getStartNode(d.preNode);
            }

            node.on("mouseover", function (d) {
                d3.select(this).attr('r', cRadius * 110 / 100);
                //Show Shortest path from Start to This d
                if (d.preNode) {
                    $("label#direct").html("Đường đi ngắn nhất từ " + getStartNode(d) + " đến " + d.name + " là " + d.distance + "<br/>");
                    dijkstra.colorShortestPath(d);
                } else {
                    $("label#direct").html(direct);
                }
            });

            node.on("mouseout", function (d) {
                d3.select(this).attr('r', cRadius);
                d3.selectAll(".link").style('stroke', "#000000");
            });

            var dijkstra = d3.dijkstra()
                .nodes(nodes)
                .edges(links);

            node.on("click", dijkstra.runAllShortestPathFromStart);
            $("label#direct").html(direct);
        });
    }
    Draw($("#open_file_csv").val())

    d3.dijkstra = function () {
        var dijkstra = {}, nodes, edges, source, go, dispatch = d3.dispatch("start", "tick", "step", "end");
        var color = d3.scale.linear().domain([0, 3, 10]).range(["green", "yellow", "red"]);
        var translate_speed = 1000;
        var cRadius = 35, strokeWidth = 2;
        dijkstra.runAllShortestPathFromStart = function (src) {
            // clear previous run
            $("label#direct").html(direct);
            clearInterval(go);

            // reset styles
            d3.selectAll('.node').style('fill', '#fff').attr('r', cRadius).style('stroke-width', strokeWidth);
            d3.select('.' + src.name).style('fill', '#fdb03f').style('stroke-width', '0');
            d3.selectAll('.nodetext').text(function (d) {
                return d.name
            });

            source = src;
            var unvisited = [];

            nodes.forEach(function (d) {
                d.preNode = null;
                if (d != src) {
                    d.distance = Infinity;
                    unvisited.push(d);
                    d.visited = false;
                }
            });

            var current = src;
            current.distance = 0;

            function tick() {
                current.visited = true;
                current.links.forEach(function (link) {

                    if (!link.target.visited) {
                        var dist = current.distance + link.value;
                        if (dist < link.target.distance) {
                            nodes.forEach(function (d) {
                                if (link.target.name === d.name) {
                                    d.preNode = link.source; //gan preNode
                                }
                            });
                        }
                        link.target.distance = Math.min(dist, link.target.distance);
                        d3.select('.' + link.target.name).transition().delay(translate_speed / 8).duration(500).attr('r', cRadius + link.value).style('fill', '#ecf0f1')
                        d3.select('.nodetext.' + link.target.name).transition().delay(translate_speed / 8).duration(500).text(link.target.distance)
                        d3.select('.linktext.' + link.id).style('opacity', 1).transition().duration(translate_speed).text(+link.value)
                    }
                });
                if (unvisited.length == 0 || current.distance == Infinity) {
                    clearInterval(go)
                    return true
                }
                unvisited.sort(function (a, b) {
                    return b.distance - a.distance
                });

                current = unvisited.pop()

                d3.select('.' + current.name)
                    .transition().delay(translate_speed * 2 / 5).duration(translate_speed / 5).attr('r', cRadius * 90 / 100)
                    .transition().duration(translate_speed / 5).attr('r', cRadius)
                    .style("fill", '#D0E1C3')
                    .style('stroke-width', '0');

                d3.select('.nodetext.' + current.name)
                    .transition().delay(translate_speed * 4 / 5).text(function (d) {
                        return d.name + " (" + d.distance + "-" + d.preNode.name + ")"
                    })

            }

            tick()
            go = setInterval(tick, translate_speed);
        };

        dijkstra.nodes = function (_) {
            if (!arguments.length)
                return nodes;
            else {
                nodes = _;
                return dijkstra;
            }
        };

        dijkstra.edges = function (_) {
            if (!arguments.length)
                return edges;
            else {
                edges = _;
                return dijkstra;
            }
        };

        dijkstra.source = function (_) {
            if (!arguments.length)
                return source;
            else {
                source = _;
                return dijkstra;
            }
        };

        dijkstra.colorShortestPath = function (d) {
            if (!d.preNode) {
                $("label#direct").html($("label#direct").html() + d.name);
                return;
            }
            this.colorShortestPath(d.preNode);
            d3.select("." + d.name + d.preNode.name).style('stroke', "blue");
            d3.select("." + d.preNode.name + d.name).style('stroke', "blue");
            $("label#direct").html($("label#direct").html() + " ==> " + d.name);
        };

        return d3.rebind(dijkstra, dispatch, "on", "end", "start", "tick");
    };

})
<script type="text/javascript" src="require.js"></script>



그런 후에 다음과 같이 설정한다.
<script type="text/javascript">
    // jQuery를 가져온 후 실행한다.
    require(["http://code.jquery.com/jquery-1.6.2.min.js"], function() {
        // CDN으로부터 jQuery가 로드된 뒤에 아래의 코드가 실행된다.
        alert($().jquery);
    });
</script>

무언가를 포함시키고 싶다면, 그때마다 require 함수를 사용해서 가져온다는 지극히 단순한 구조이다. 이렇게 require 함수로 무언가를 로드하면, 로드하기 전에 또 거기에 종속성이 있는지 판별한뒤에 종속성이 있는 것들을 먼저 가져온 후 require로 로드하려는 것을 불러온다. 그 후에 콜백함수가 실행되는 것이다.

이 코드가 실행되면 alert box에 jQuery의 버전이 표시될 것이다. 하지만 이런 방식으로 불러오는 것은 권장할 만한 일이 아니다. 문제는 jQuery가 실행될 때 전역 네임스페이스가 우리가 잘 아는 $ 변수로 오염된다는 사살이다. 물론 한가지 버전의 jQuery만 쓴다면 큰 문제가 되지 않지만, 만약 동시에 두 개의 다른 버전의 jQuery를 써야한다면 어떻게 해야할까?



RequireJS modules 이란?

RequireJS의 모듈 패턴은 전역 네임스페이스에 덮어쓰거나 오염시키는 일 없이, 별도의 컨텍스트에서 자바스크립트를 실행한 뒤에 결과를 다시 호출한 곳으로 리턴해줄 수 있다.

모듈은 전통적인 스크립트 파일과는 달리 전역 네임스페이스 오염을 피할 수 있는 한정된 범위(well-scoped)의 객체를 선언한다는 점에서 차이가 있다. 모듈은 해당 모듈의 디펜던시 목록을 명시할 수 있고 전역 객체에 대한 참조 없이도 이러한 디펜던시들을 모듈 상의 함수에 인자(arguments)로 받음으로써 핸들링할 수 있게 해준다.

다음과 같이 jQuery를 모듈화할 수 있다.


//jquery.min.js 파일 내 임의의 라인에서,
define(function() {

    // 여기는 원본 jQuery 코드

    // jQuery 객체를 리턴한다.
    return jQuery.noConflict(true);
});


주의해서 살펴볼 점은, 위의 예제에서 jQuery가 기본적으로 전역 객체로 선언되는 것을 막기위해 jQuery.noConflict 를 사용해서 jQuery 객체를 가져왔다는 사실이다.
이 모듈화된 jQuery 라이브러리를 사용하려면, 다음과 같은 방식으로 사용하면 된다.


<script type="text/javascript">
    //jQuery 수정 버전을 로드한다.
    require(["jquery.min.js"], function($) {
        //이제 $ 에는 jQuery 객체가 담기게 된다.
        var jQuery = $;
        alert($().jquery);
    });
</script>


중요한 점은 jQuery 객체는 이제 오직 모듈 안에 선언된 function scope 안에서만 사용가능하다는 점이다. 이러한 방식으로 이제 어플리케이션에서 충돌없이 다른 두 종류의 jQuery 버전을 안전하게 사용할 수 있게 된다.



<script type="text/javascript">
    //jQuery 1.6.2 버전을 사용
    require(["jquery.1.6.2.js"], function($) {
        // 여기 $ 에는 jQuery 1.6.2 객체가 담기게 된다.
        var jQuery = $;
        alert($().jquery);
    });

    //jQuery 1.5.1 버전을 사용
    require(["jquery.1.5.1.js"], function($) {
        // 여기 $ 에는 jQuery 1.5.1 객체가 담기게 된다.
        var jQuery = $;
        alert($().jquery);
    });
</script>



RequireJS 기본적인 사용 방법

가장 기본적인 형태의 사용예를 통해 실제 어떤 식으로 RequireJS를 활용할 수 있는지 확인해보자.

먼저 index.html 파일은 아래와 같이 구성할 수 있을 것이다.

index.html 파일
<!DOCTYPE html>
<html>
    <head>
        <title>RequireJS Example</title>
    </head>
    <body>

        <!-- 여기는 컨텐츠 -->

        <!--
            이 data-main 속성에서 requireJS가 처음 로드해야할 JS를 설정한다.
            아래와 같이 쓰면, js 폴더 아래에 main.js 파일을 열게 된다.
         -->
        <script data-main="js/main" src="lib/require/require.js"></script>
    </body>
</html>

위와 같이 require.js 파일을 로드해주는 부분에 data-main 속성을 설정해서 RequireJS가 로드된 후 바로 로드해서 실행해줄 JavaScript 파일을 지정해줄 수 있다. 위의 예에서는 require.js 파일이 로드된 후에 바로 js 폴더 아래에 main.js 파일을 불러와서 실행하게 된다.

main.js 파일은 아래와 같이 구성될 수 있다.

main.js 파일
//requireJS 기본 설정 부분
requirejs.config({
/*
    baseUrl:
    JavaScript 파일이 있는 기본 경로를 설정한다.
    만약 data-main 속성이 사용되었다면, 그 경로가 baseUrl이 된다.
    data-main 속성은 require.js를 위한 특별한 속성으로 require.js는 스크립트 로딩을 시작하기 위해 이 부분을 체크한다.
*/
    baseUrl: 'js', // 'js' 라는 폴더를 기본 폴더로 설정한다. 

/*
    paths: 
    path는 baseUrl 아래에서 직접적으로 찾을 수 없는 모듈명들을 위해 경로를 매핑해주는 속성이다.
    "/"로 시작하거나 "http" 등으로 시작하지 않으면, 기본적으로는 baseUrl에 상대적으로 설정하게 된다.

    paths: {
        "exam": "aaaa/bbbb"
    }

    의 형태로 설정한 뒤에, define에서 "exam/module" 로 불러오게 되면, 스크립트 태그에서는 실제로는 src="aaaa/bbbb/module.js" 로 잡을 것이다.
    path는 또한 아래와 같이 특정 라이브러리 경로 선언을 위해 사용될 수 있는데, path 매핑 코드는 자동적으로 .js 확장자를 붙여서 모듈명을 매핑한다.
*/
    paths:{

        //뒤에 js 확장자는 생략한다.
        'text': '../lib/require/text',
        'jquery': '../lib/jquery/jquery-1.7.min',
        'angular': '../lib/angular/angular-1.0.4'
    },

/*
    shim:
    AMD 형식을 지원하지 않는 라이브러리의 경우 아래와 같이 shim을 사용해서 모듈로 불러올 수 있다.
    참고 : http://gregfranko.com/blog/require-dot-js-2-dot-0-shim-configuration/
*/
    shim:{
        'angular':{
            deps: ['jquery'], //angular가 로드되기 전에 jquery가 로드 되어야 한다.
            exports:'angular' //로드된 angular 라이브러리는 angular 라는 이름의 객체로 사용할 수 있게 해준다
        }
    }
});

//requireJS를 활용하여 모듈 로드
requirejs( [
        //디펜던시가 걸려있으므로, 이 디펜던시들이 먼저 로드된 뒤에 아래 콜백이 수행된다.
        'text', //미리 선언해둔 path, css나 html을 로드하기 위한 requireJS 플러그인
        'jquery', //미리 선언해둔 path, jQuery는 AMD를 지원하기 때문에 이렇게 로드해도 jQuery 또는 $로 호출할 수 있다.
        'angular' //미리 선언해둔 path
    ],

    //디펜던시 로드뒤 콜백함수. 로드된 디펜던시들은 콜백함수의 인자로 넣어줄 수 있다.
    function (text, $, angular) {

        //이 콜백 함수는 위에 명시된 모든 디펜던시들이 다 로드된 뒤에 호출된다.
        //주의해야할 것은, 디펜던시 로드 완료 시점이 페이지가 완전히 로드되기 전 일 수도 있다는 사실이다.
        //이 콜백함수는 생략할 수 있다.

        //페이지가 완전히 로드된 뒤에 실행
        $(document).ready(function () {

            var jQuery = $;
            alert($().jquery);

        });
    }
);
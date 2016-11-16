$("#mainPagePreviousSearches").hide();

$("#WeatherForm").submit(function(e)
{ 
	  e.preventDefault();
    var enteredlocation = $("#enterLocation").val();
    fetchData(enteredlocation); /* to display the weather details monthly and daily */
 	    
});

/*Fetching user's current location */
$(document).ready(function() 
{
  navigator.geolocation.getCurrentPosition(function(pos) 
  {
    geocoder = new google.maps.Geocoder();
    var latlng = new google.maps.LatLng(pos.coords.latitude,pos.coords.longitude);
    geocoder.geocode({'latLng': latlng}, function(results, status) 
    {
       if (status == google.maps.GeocoderStatus.OK) 
       {
         var result = results[0];
         for(var i=0;i<result.address_components.length;i++)
         {
           /*It will return only that data which has a route name */
           if(result.address_components[i].types == "route")
           {
             fetchData(result.address_components[i].long_name);
           }
         }
       }
    }); 
  });
});
  
function fetchData(addressEntry)
{
    /*To display the temperature of user-entered location */
    var weatherUrl = "http://api.openweathermap.org/data/2.5/weather?q="+addressEntry+"&units=imperial&appid=0a6f467c8197de9833cc614e670ebec9";
    $.getJSON( weatherUrl, function( data ) 
    {
      var weatherIcon = "http://openweathermap.org/img/w/"+data.weather[0].icon+".png";
        var html = '<h3><center>Weather in '+ data.name +' is ' + ': <h4>'+data.main.temp+' <sup>o</sup>F</h4><img src="'+ weatherIcon +'"></center></h3>';
        if(data.cod === 502)
            {
                alert("test");
            }
     $("#jumbo").html(html);
        saveData(data.name);
        
    });
    
    /*To display extra details in a page */
    $.getJSON( weatherUrl, function( data ) 
    {
      var pressure=data.main.pressure;
      var humidity=data.main.humidity;
      var mintemp=data.main.temp_min;
      var maxtemp=data.main.temp_max;
      $("#currentCityPressure").html(pressure);
      $("#currentCityHumidity").html(humidity);
      $("#currentCityMinTemp").html(mintemp);
      $("#currentCityMaxTemp").html(maxtemp);
    });
    
    /*To display hourly temperature */
    var hourlyUrl = "http://api.openweathermap.org/data/2.5/forecast?q="+addressEntry+"&units=imperial&appid=0a6f467c8197de9833cc614e670ebec9";
    $.getJSON( hourlyUrl, function( data ) 
    {
      var hourlyTempList= data.list;
      var hourlyTemp ="<table class='table table-bordered table-striped'>";
      for(var i = 0;i<hourlyTempList.length;i++)
      {
        hourlyTemp +='<td>'+hourlyTempList[i].dt_txt+'</td>'; 
        var weatherIcon = "http://openweathermap.org/img/w/"+hourlyTempList[i].weather[0].icon+".png";
        hourlyTemp +='<td><img src="'+ weatherIcon +'">' + hourlyTempList[i].main.temp+'°F</td></tr>';
      }
        hourlyTemp += "</table>";
        $("#hourlyWeather").html(hourlyTemp);
    });
    
    /*To display daily temperature*/
    var dailyUrl = "http://api.openweathermap.org/data/2.5/forecast/daily?q="+addressEntry+"&units=imperial&appid=0a6f467c8197de9833cc614e670ebec9";
    $.getJSON( dailyUrl, function( data ) 
    {
      var dailyTempList= data.list;
      var dailyTemp ="<table class='table table-bordered table-striped'>";
      for(var i = 0;i<dailyTempList.length;i++)
      {
        dailyT=new Date(dailyTempList[i].dt*1000);/*To convert UTC time zone into */
        dailyN=dailyT.toDateString();/*To get day and time */
        dailyTemp +='<tr><td>'+dailyN+'</td>'; 
        var weatherIcon = "http://openweathermap.org/img/w/"+dailyTempList[i].weather[0].icon+".png";
        dailyTemp +='<td><img src="'+ weatherIcon +'">' + dailyTempList[i].temp.day+'°F</td></tr>';
      }
        dailyTemp += "</table>";

        $("#dailyWeather").html(dailyTemp);
    });
    /*var cityName = document.getElementById("enterLocation").value;
    */
    /*To save data into sqlite database */
 }          
 
 /*Storing it in sqlite database. It will not work in firefox browser as their default is indexDB. Run this portio of the code only in chrome browser */ 
 var databaseOptions = {
            fileName: "sqlite_previous_weather_search",
            version: "1.0",
            displayName: "Weather Channel",
            maxSize: 1024
        };

  var database = openDatabase(
            databaseOptions.fileName,
            databaseOptions.version,
            databaseOptions.displayName,
            databaseOptions.maxSize
        );

/*Unique keyword makes sure that only unique text is entered into the database and no need of AUTO INCREMENT column in sqlite as it inbuilt auto increments rowid*/
  database.transaction(
            function( transaction ){
                transaction.executeSql(
                    "CREATE TABLE IF NOT EXISTS WeatherDetails (city TEXT UNIQUE);"
                );
            }
        );

/* to save data into sqlite database */
 function saveData(cityName)
 {
    
    database.transaction(
            function(transaction)
            {
                transaction.executeSql(
                    "INSERT INTO WeatherDetails (city) VALUES ('"+cityName+"');"
                );
             });
     getData(); /*To display inside the previous search panel */
 }


/*To display data from database into previous searches panel */
function getData(){
  $("#mainPagePreviousSearches").show();
  var previousSearch="";
  database.transaction(
    function( transaction ){
    transaction.executeSql('SELECT rowid, city FROM WeatherDetails', [],
    function(transaction, results)
    {
     for(var i=0;i<results.rows.length;i++)
      {
        previousSearch +="<tr><td><button class='btn btn-info btn-sm'  onclick='display(" + results.rows[i].rowid+ ")'>" + results.rows[i].city +"</button></td></tr> ";

        $("#previousSearches").html(previousSearch);
      }
    },
  function(transaction, error)
  {
    console.log(error);
  });
});
}

$('#confirmationModal').on('click','.btn-danger',function()
{
    database.transaction(
      function(transaction){
        transaction.executeSql('DROP TABLE WeatherDetails');
          location.reload(); /* to reload the page */
       });
})

/*To display the weather details from previous searches */
function display(id)
{
  database.transaction(function( transaction )
   {
      transaction.executeSql('SELECT city FROM WeatherDetails where rowid=?', [id],
      function(transaction, results)
      {
         fetchData(results.rows[0].city);
      },
      function(transaction, error)
      {
         console.log(error);
      });
   });
}  
      